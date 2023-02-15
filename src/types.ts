export interface MetaRating extends Meta {
  title: string;
}

export interface MetaPriceCategory extends Meta {
  currency_sign: string;
  total_symbols: number;
  highlighted_symbols: number;
}

export interface Meta {
  type: "rating" | "price_category";
}

export type PlaceLocation = {
  geo: {
    latitude: number;
    longitude: number;
  };
  short: string;
};

export type Place = {
  id: string;
  brand: string;
  name: string;
  photo_url: string;
  rating?: string;
  location: PlaceLocation;
  price: number;
};
