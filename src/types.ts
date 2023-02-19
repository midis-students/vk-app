export type Event = {
  name: string; 
}

export type UpdateQuery = {
  Querystring: {
    t: string;
  };
};

export type APIPlace = {
  logo: string;
  phones: Array<string>;
  address: string;
  geoPoint: [number, number];
  type: 'cinema' | 'concerthall' | 'theatre' | 'museum' | 'gallery' | 'showRoom' | 'restaurant' | 'other';
  name: string;
  price: number;
};

