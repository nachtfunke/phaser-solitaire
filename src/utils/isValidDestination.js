// check if a value is a valid destination, meaning, it has x and y properties
export function isValidDestination(destination) {
    return destination && destination.x !== undefined && destination.y !== undefined;
}