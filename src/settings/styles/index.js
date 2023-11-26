import text from "./text"
import spacing from "./spacing"

export const STYLES = {
    text,
    spacing,
    debugging: {
        background: {
            color: 0x000000,
            alpha: 0.7,
            borderRadius: 3,
        },
        text: {
            fontFamily: text.fonts.mono,
            fontSize: text.sizes.xs,
            color: '#ffffff',
        },
        padding: spacing.xs,
    },
    buttons: {
        debugging: {
            background: {
                color: 0x333333,
                borderRadius: 3,
            },
            text: {
                fontFamily: text.fonts.sans,
                fontSize: text.sizes.m,
                color: '#ffffff',
            },
            padding: spacing.m,
            shadow: {
                size: 4,
            }
        },
    }
}