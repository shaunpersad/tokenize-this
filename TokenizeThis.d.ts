declare module 'tokenize-this' {

    export interface Options {
        shouldTokenize?: string[];
        shouldMatch?: string[];
        shouldDelimitBy?: string[];
        convertLiterals?: boolean;
        escapeCharacter?: string;
    }

    export type Token = string | boolean | null | number;

    class TokenizeThis {
        constructor(options?: Options);
        tokenize(
            input: string,
            callback: (token: Token, surroundedBy?: string, index?: number) => void,
        ): void;
    }

    export default TokenizeThis;

}
