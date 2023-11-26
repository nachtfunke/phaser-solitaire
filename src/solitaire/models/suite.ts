import type { CardModel } from "./card";
import type { ClubsSuit, DiamondsSuit, HeartsSuit, SpadesSuit, SuitModel, SuitType } from "./suit";

export interface SuiteModel<S extends SuitType | SuitModel> {
    suit: S;
    cards: CardModel<S>[];
}

export type HeartsSuite = SuiteModel<HeartsSuit>;
export type SpadesSuite = SuiteModel<SpadesSuit>;
export type ClubsSuite = SuiteModel<ClubsSuit>;
export type DiamondsSuite = SuiteModel<DiamondsSuit>;

export type SuiteType = HeartsSuite | SpadesSuite | ClubsSuite | DiamondsSuite;