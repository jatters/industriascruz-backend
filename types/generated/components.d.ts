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
    name: Schema.Attribute.String;
    price: Schema.Attribute.Integer;
    regularPrice: Schema.Attribute.Integer;
    sku: Schema.Attribute.String;
    state: Schema.Attribute.Enumeration<['Activo', 'Desactivado']> &
      Schema.Attribute.DefaultTo<'Activo'>;
    stockStatus: Schema.Attribute.Enumeration<['En Existencia', 'Agotado']>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'icons.iconos': IconsIconos;
      'seo.seo': SeoSeo;
      'variaciones.variaciones': VariacionesVariaciones;
    }
  }
}
