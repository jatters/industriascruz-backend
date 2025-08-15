import type { Schema, Struct } from '@strapi/strapi';

export interface IconsIconos extends Struct.ComponentSchema {
  collectionName: 'components_icons_iconos';
  info: {
    description: '';
    displayName: 'Iconos';
  };
  attributes: {
    isEcoFriendly: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isInternationallyTested: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    isRetieCompliant: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
  };
}

export interface ReglaDeEnvioRangosDeEnvio extends Struct.ComponentSchema {
  collectionName: 'components_regla_de_envio_rangos_de_envios';
  info: {
    displayName: 'Rango de Volumen';
  };
  attributes: {
    maxQty: Schema.Attribute.Integer;
    minQty: Schema.Attribute.Integer;
    name: Schema.Attribute.String;
    price: Schema.Attribute.Integer;
  };
}

export interface ReglaDeEnvioReglasDeEnvio extends Struct.ComponentSchema {
  collectionName: 'components_regla_de_envio_reglas_de_envios';
  info: {
    displayName: 'Reglas de env\u00EDo';
  };
  attributes: {
    byVolume: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    mode: Schema.Attribute.Enumeration<['Pago', 'Gratuito', 'Cotizar']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Pago'>;
    name: Schema.Attribute.String;
    price: Schema.Attribute.Integer;
    ranges: Schema.Attribute.Component<'regla-de-envio.rangos-de-envio', true>;
    shippingClass: Schema.Attribute.Relation<
      'manyToOne',
      'api::shipping-class.shipping-class'
    >;
  };
}

export interface SeoSeo extends Struct.ComponentSchema {
  collectionName: 'components_seo_seos';
  info: {
    displayName: 'SEO';
  };
  attributes: {
    focusKeywords: Schema.Attribute.String;
    metaDescription: Schema.Attribute.Text;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface VariacionesVariaciones extends Struct.ComponentSchema {
  collectionName: 'components_variaciones_variaciones';
  info: {
    description: '';
    displayName: 'Variaciones';
  };
  attributes: {
    attribute: Schema.Attribute.Relation<
      'oneToOne',
      'api::attribute.attribute'
    >;
    image: Schema.Attribute.Media<'images'>;
    lowStockAmount: Schema.Attribute.Integer;
    manageStock: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    name: Schema.Attribute.String;
    price: Schema.Attribute.Integer;
    regularPrice: Schema.Attribute.Integer;
    sku: Schema.Attribute.String;
    state: Schema.Attribute.Enumeration<['Activo', 'Desactivado']> &
      Schema.Attribute.DefaultTo<'Activo'>;
    stockQty: Schema.Attribute.Integer;
    stockStatus: Schema.Attribute.Enumeration<['En Existencia', 'Agotado']>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'icons.iconos': IconsIconos;
      'regla-de-envio.rangos-de-envio': ReglaDeEnvioRangosDeEnvio;
      'regla-de-envio.reglas-de-envio': ReglaDeEnvioReglasDeEnvio;
      'seo.seo': SeoSeo;
      'variaciones.variaciones': VariacionesVariaciones;
    }
  }
}
