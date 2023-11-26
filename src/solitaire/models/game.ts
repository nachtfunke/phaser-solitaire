// a "Game" is a specific version, flavour of Solitaire. For example, Osmosis, FreeCell, Klondike, etc.
// it does not retain the state of the game, only the rules and logic of the game.

import type { CardModel } from "./card";
import type { DeckModel } from "./deck";
import type { SuitModel } from "./suit";

// it does however tell you information about the deck being used and the cards in play.
export interface GameModel {
    // DECK
    // ----------------------
    // deck needs to be modified according to rules
    // Each card is assigned a value, if they are relevant.
    // In Pyramid for example, the value of a card is its rank and its relevant.
    // In Osmosis for example, the value of a card is irrelevant.
    // In Klondike, the value is irrelevant but the rank is.
    deck: DeckModel;

    // DEALING (from the talon)
    // ----------------------
    // determine the rules for dealing cards from the talon.
    // For example, in Klondike and in Osmosis, the cards are dealt 3 at a time, but in Pyramid, they are dealt 1 at a time.
    dealing: {
        cardsPerDeal: number;
        redeals: "infinite" | number;
        shuffleOnReDeal?: boolean;
    }
    // What type of depots does it use to be placed
    depots: DepotModel[];
}

// DEPOT - a place for cards to be placed to
// ----------------------
// for example, a foundation, a reserve or the wastepile
// reach depot has a set of rules for which cards can be played to it.
// for example, where a card can come from, and which cards are in general allowed
// the actual deciding factor for what card is allowed, depends on the game and it depends on the current card that is already on. So the rules for playing a card to a depot defined on the depot itself are described generically.

// a card is being packed, when it is being placed in accordance with a sequence. That sequence depends on the game rule. A card is being packed on the foundation in klondike, when it is alternating red / black cards.
// a card is being placed in the wastepile though. What that means, is that a card that is being placed is not being question beyond its origin. It is simply being placed on top of the previous card.
export type PlacementType = "packing" | "placing";

// The type of packing rules.
// For example, in Klondike, the packing rules are: "rank-descending" and "color-alternating"
// "cascade" determines, that the rules for packing are cascading down from another depot, for example in osmosis, the allowed cards are determined by the cards that are already on the previous foundation.
export type PackingRuleName = "suite" | "rank" | "color" | "marriage" | "value" | "cascade" | "specific-card";
export type PackingRule = { [key in PackingRuleName]: () => boolean}

// The type of drawing rules.
// not to be confused with dealing. Dealing comes from the talon. Drawing comes from any other depot, like the reserve.
export type DrawingRuleName = "faces" | "count";
export type DrawingRule = { [key in DrawingRuleName]: () => boolean}

// Depot Finishing Rules
// a depot may or may not be finishable. For example, in Osmosis, reserves are finished when they are depleaded. If they are finished, their spot remains empty. But in Klondike, foundations are finished when they are full. But the piles can be packed upon again, when empty. 
export type DepotFinishingRuleName = "empty" | "full" | "depleted" | "value" | "suite" | "suit" | "foursome" | "specific-card";
export type DepotFinishingRule = { [key in DepotFinishingRuleName]: () => boolean}

export type FacingModes = "face-up" | "face-down" | "alternating" | "first";

export type DepotState = "open" | "closed" | "locked" | "finished";

export interface DepotModel {
    type: "placing" | "drawing"; // a foundation is being placed (or placed) to and a reserve is being drawn from
    rules?: {
        placement?: {
            type: PlacementType
            firstCardRules?: PackingRule[]; // determines, which rules a first card must follow, that can go on here.
            rules?: PackingRule[]; // determines, which rules a placed card must follow, when the depot must be packed. Instead of defining, which cards are allowed, this generic rule can cover all cases.
            allowedOrigins?: DepotModel[]; // where can it come from?
        };

        drawing?: {
            rules?: DrawingRule[]
            allowedDestinations?: DepotModel[]; // where can a drawn card go to?
        }
        
        finishing?: {
            rules?: DepotFinishingRule[]; // These rules determine, how a depot is finished.
            postFinishBehaviour?: "remove" | "seal" | "keep"; // what happens to the depot, when it is finished?
        }
    };
    faces: FacingModes;
    cards?: CardModel<SuitModel>[];
    state: DepotState;
    location: any; // the location of the depot in the tableau or in the layout. The actual position in the layout must be determined by the layout itself. The layout defines depots, not the other way around.
}