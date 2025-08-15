// ./src/api/product/content-types/product/lifecycles.js
'use strict';

const axios      = require('axios');
const WP_URL     = process.env.WP_BASE_URL;
const WP_KEY     = process.env.WP_CONSUMER_KEY;
const WP_SECRET  = process.env.WP_CONSUMER_SECRET;
const STRAPI_URL = process.env.STRAPI_URL;
const auth       = { username: WP_KEY, password: WP_SECRET };

/**
 * Convierte tus bloques de Strapi a HTML.
 */
function htmlFromBlocks(blocks) {
  if (typeof blocks === 'string') return blocks;
  if (!Array.isArray(blocks)) return '';
  return blocks
    .map(block => {
      // párrafos
      if (block.type === 'paragraph' && Array.isArray(block.children)) {
        const text = block.children.map(c => c.text).join('');
        return `<p>${text}</p>`;
      }
      // lista con viñetas
      if (block.type === 'bulleted-list' && Array.isArray(block.children)) {
        const items = block.children
          .map(li => {
            const inner = Array.isArray(li.children)
              ? li.children.map(c => c.text).join('')
              : '';
            return `<li>${inner}</li>`;
          })
          .join('');
        return `<ul>${items}</ul>`;
      }
      // lista numerada
      if (block.type === 'numbered-list' && Array.isArray(block.children)) {
        const items = block.children
          .map(li => {
            const inner = Array.isArray(li.children)
              ? li.children.map(c => c.text).join('')
              : '';
            return `<li>${inner}</li>`;
          })
          .join('');
        return `<ol>${items}</ol>`;
      }
      return '';
    })
    .join('');
}

/**
 * Busca un producto en WooCommerce por SKU.
 */
async function findBySKU(sku) {
  try {
    const { data } = await axios.get(
      `${WP_URL}/wp-json/wc/v3/products?sku=${encodeURIComponent(sku)}`,
      { auth }
    );
    return Array.isArray(data) && data[0]?.id ? data[0].id : null;
  } catch {
    return null;
  }
}

/**
 * Construye el payload sólo con keys válidas de la API de WC.
 */
async function mapToWpPayload(p) {
  // 1) Imágenes
  const images = [];
  if (p.image?.data?.attributes.url) {
    images.push({
      src: `${STRAPI_URL}${p.image.data.attributes.url}`,
      alt: p.image.data.attributes.alternativeText || '',
    });
  }
  (p.gallery?.data || []).forEach(file => {
    const { url, alternativeText } = file.attributes;
    images.push({ src: `${STRAPI_URL}${url}`, alt: alternativeText || '' });
  });

  // 2) Categoría única
  const categories = [];
  if (p.productCategory?.data) {
    const slug = p.productCategory.data.attributes.slug;
    const { data } = await axios.get(
      `${WP_URL}/wp-json/wc/v3/products/categories?slug=${slug}`,
      { auth }
    );
    if (data[0]?.id) categories.push({ id: data[0].id });
  }

  // 3) Tags
  const rawTags = p.tags?.data || [];
  const tags = await Promise.all(
    rawTags.map(async t => {
      const slug = t.attributes.slug;
      const { data } = await axios.get(
        `${WP_URL}/wp-json/wc/v3/products/tags?slug=${slug}`,
        { auth }
      );
      return data[0]?.id ? { id: data[0].id } : null;
    })
  ).then(arr => arr.filter(Boolean));

  // 4) Metadatos genéricos
  const meta_data = [
    { key: 'opciones_de_entrega',  value: p.deliveryMethods },
    { key: 'days_of_shipping',     value: p.minShippingDays },
    { key: 'days_of_shipping_two', value: p.maxShippingDays },
    { key: 'height_product',       value: p.height },
    { key: 'width_product',        value: p.width },
    { key: 'depth_product',        value: p.depth },
    { key: 'product_weight',       value: p.weight },
  ];

  // 5) Payload base
  const payload = {
    name:              p.name,
    slug:              p.slug,
    sku:               p.sku,
    type:              p.type.toLowerCase(),
    regular_price:     p.regularPrice?.toString() || '',
    price:             p.price?.toString()        || '',
    description:       htmlFromBlocks(p.longDescription),
    short_description: htmlFromBlocks(p.shortDescription),
  };

  // 6) Sólo si hay oferta
  if (
    p.price != null &&
    p.regularPrice != null &&
    Number(p.price) < Number(p.regularPrice)
  ) {
    payload.sale_price = p.price.toString();
  }

  // 7) Arrays condicionales
  if (images.length)     payload.images     = images;
  if (categories.length) payload.categories = categories;
  if (tags.length)       payload.tags       = tags;
  if (meta_data.length)  payload.meta_data  = meta_data;

  return payload;
}

/**
 * Upsert en WC: POST si no existe, PUT si ya hay ID.
 */
async function syncWooProduct(p) {
  const payload = await mapToWpPayload(p);
  strapi.log.info('▶️ Payload WC:', JSON.stringify(payload, null, 2));

  const existingId = await findBySKU(p.sku);
  if (existingId) {
    await axios.put(
      `${WP_URL}/wp-json/wc/v3/products/${existingId}`,
      payload,
      { auth }
    );
    strapi.log.info(`🔄 SKU=${p.sku} actualizado (WC ID ${existingId})`);
    return existingId;
  } else {
    const { data } = await axios.post(
      `${WP_URL}/wp-json/wc/v3/products`,
      payload,
      { auth }
    );
    strapi.log.info(`✅ SKU=${p.sku} creado (WC ID ${data.id})`);
    return data.id;
  }
}

module.exports = {
  /**
   * afterCreate: al crear producto.
   * Si viene ya publicado (publishedAt), sincroniza.
   */
  async afterCreate(event) {
    const { result } = event;
    if (!result.publishedAt) return;

    const full = await strapi.entityService.findOne(
      'api::product.product',
      result.id,
      {
        populate: ['image','gallery','productCategory','tags']
      }
    );
    const wpId = await syncWooProduct(full);
    if (wpId) {
      await strapi.db.query('api::product.product').update({
        where: { id: full.id },
        data:  { wp_id: wpId },
      });
    }
  },

  /**
   * afterUpdate: en cualquier edición, incluyendo publish/unpublish.
   * Ya no ignoramos el publishedAt aquí.
   */
  async afterUpdate(event) {
    const { result, params } = event;
    const changed = Object.keys(params.data || {});
    // sólo ignoramos cambios irrelevantes
    if (changed.length === 1 && changed[0] === 'updatedAt') return;

    const full = await strapi.entityService.findOne(
      'api::product.product',
      result.id,
      {
        populate: ['image','gallery','productCategory','tags']
      }
    );
    const wpId = await syncWooProduct(full);
    if (wpId && (!full.wp_id || full.wp_id !== wpId)) {
      await strapi.db.query('api::product.product').update({
        where: { id: full.id },
        data:  { wp_id: wpId },
      });
    }
  },
};
