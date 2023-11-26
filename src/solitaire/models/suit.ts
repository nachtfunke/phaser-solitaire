export interface SuitModel {
    id: string;
    name: string;
    color: string;
}

export interface HeartsSuit extends SuitModel {
    id: "hearts";
    name: "Hearts";
    color: "red";
}

export interface SpadesSuit extends SuitModel {
    id: "spades";
    name: "Spades";
    color: "black";
}

export interface ClubsSuit extends SuitModel {
    id: "clubs";
    name: "Clubs";
    color: "black";
}

export interface DiamondsSuit extends SuitModel {
    id: "diamonds";
    name: "Diamonds";
    color: "red";
}

export interface JokerSuit extends SuitModel {
    id: "joker";
    name: "Joker";
    color: "red" | "black";
}

export type SuitType = HeartsSuit | SpadesSuit | ClubsSuit | DiamondsSuit | JokerSuit;

export type SuitRank = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | number;