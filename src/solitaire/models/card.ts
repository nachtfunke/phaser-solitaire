import type { HeartsSuit, JokerSuit, SuitModel, SuitRank, SuitType } from "./suit";

export type CardModel<S extends SuitType | SuitModel> = {
    id: string;
    suit: S;
    type: "face" | "number" | "joker";
    rank: SuitRank;
    name: string;
}

export type SuitFaces = "Jack" | "Queen" | "King" | "Ace";

export type FaceCardModel<S extends SuitType | SuitModel> = CardModel<S> & {
    type: "face";
    rank: 11 | 12 | 13;
    name: string;
}

export type NumberCardModel<S extends SuitType | SuitModel> = CardModel<S> & {
    type: "number";
    rank: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    name: string;
}

// make a type for the jokerCard
export type JokerCardModel = CardModel<JokerSuit> & {
    type: "joker";
    rank: 0;
    name: string;
}