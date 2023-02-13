export interface MetaRating extends Meta {
    title: string
}

export interface MetaPriceCategory extends Meta {
    currency_sign: string;
    total_symbols: number;
    highlighted_symbols: number;
}

export interface Meta {
    type: "rating" | "price_category"
}

export type Place = {
    name: string;
    photo_url: string;
    rating?: string;
    price_category?: {
        currency_sign: string;
        total_symbols: number;
        highlighted_symbols: number;
    };
}