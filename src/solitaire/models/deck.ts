import type { Suite } from "../cards/suites";
import type { SuitModel, SuitType } from "./suit";
import type { CardModel } from "./card";

export interface DeckModel {
    id: string;
    name: string;
    cards?: CardModel<SuitType | SuitModel>[];
}