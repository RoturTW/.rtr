type Token = { type: "string" | "number" | "operator" | "keyword" | "identifier", value: any };

export interface Node {
    type: string;
}

export interface ProgramNode extends Node {
    type: "program";
    statements: StatementNode[];
}

export interface StatementNode extends Node {
    type: 
        "event" |
        "if" |
        "while" |
        "repeat" |
        "for" |
        "block" |
        "expressionStatement";
}

export interface ExpressionNode extends Node {
    type: "assignment" | "binary" | "unary" | "call" | "memberAccess" | "literal" | "identifier" | "function"
}

export interface EventStatementNode extends StatementNode {
    type: "event";
    eventType: string;
    body: BlockStatementNode;
}

export interface IfStatementNode extends StatementNode {
    type: "if";
    condition: ExpressionNode;
    thenBranch: BlockStatementNode;
    elseBranch: StatementNode | null;
}

export interface WhileStatementNode extends StatementNode {
    type: "while";
    condition: ExpressionNode;
    body: BlockStatementNode;
}

export interface RepeatStatementNode extends StatementNode {
    type: "repeat";
    amount: ExpressionNode;
    body: BlockStatementNode;
}

export interface ForStatementNode extends StatementNode {
    type: "for";
    variable: IdentifierNode;
    array: ExpressionNode;
    body: BlockStatementNode;
}

export interface BlockStatementNode extends StatementNode {
    type: "block";
    statements: StatementNode[];
}

export interface ExpressionStatementNode extends StatementNode {
    type: "expressionStatement";
    expression: ExpressionNode;
}

export interface AssignmentExpressionNode extends ExpressionNode {
    type: "assignment";
    operator: '=' | '+=' | '-=' | '*=' | '/=';
    left: ExpressionNode;
    right: ExpressionNode;
}

export type BinaryOperator = "==" | "!=" | "<" | ">" | "<=" | ">=" | "+" | "-" | "*" | "/";
export interface BinaryExpressionNode extends ExpressionNode {
    type: "binary";
    operator: BinaryOperator;
    left: ExpressionNode;
    right: ExpressionNode;
}

export type UnaryOperator = "!" | "-" | "+";
export interface UnaryExpressionNode extends ExpressionNode {
    type: "unary";
    operator: UnaryOperator;
    operand: ExpressionNode;
}

export interface CallExpressionNode extends ExpressionNode {
    type: "call";
    callee: ExpressionNode;
    arguments: ExpressionNode[];
}

export interface MemberAccessExpressionNode extends ExpressionNode {
    type: "memberAccess";
    object: ExpressionNode;
    property: string;
}

export interface LiteralNode extends ExpressionNode {
    type: "literal";
    value: string | number | null;
}

export interface IdentifierNode extends ExpressionNode {
    type: "identifier";
    name: string;
}

export interface FunctionExpressionNode extends ExpressionNode {
    type: "function";
    parameters: string[];
    body: BlockStatementNode;
}

export type AST = ProgramNode | StatementNode | ExpressionNode;
export type Statement = EventStatementNode | IfStatementNode | WhileStatementNode | BlockStatementNode | ExpressionStatementNode;
export type Expression = AssignmentExpressionNode | BinaryExpressionNode | UnaryExpressionNode | CallExpressionNode | MemberAccessExpressionNode | LiteralNode | IdentifierNode | FunctionExpressionNode;

export function tokenize(code: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    
    const keywords = new Set(['event', 'if', 'elif', 'else', 'while', "repeat", "for"]);
    
    while (i < code.length) {
        const char = code[i];
        
        if (/\s/.test(char)) {
            i++;
            continue;
        }
        
        if (char === '"') {
            let value = '';
            i++;
            while (i < code.length && code[i] !== '"') {
                if (code[i] === '\\' && i + 1 < code.length) {
                    i++;
                    switch (code[i]) {
                        case 'n': value += '\n'; break;
                        case 't': value += '\t'; break;
                        case 'r': value += '\r'; break;
                        case '\\': value += '\\'; break;
                        case '"': value += '"'; break;
                        default: value += code[i]; break;
                    }
                } else {
                    value += code[i];
                }
                i++;
            }
            i++;
            tokens.push({ type: 'string', value: value });
            continue;
        }
        
        if (/\d/.test(char)) {
            let value = '';
            while (i < code.length && /[\d.]/.test(code[i])) {
                value += code[i];
                i++;
            }
            tokens.push({ type: 'number', value: parseFloat(value) });
            continue;
        }
        
        if (i + 1 < code.length) {
            const twoChar = code.slice(i, i + 2);
            if (['==', '!=', '<=', '>=', '+=', '-=', '*=', '/='].includes(twoChar)) {
                tokens.push({ type: 'operator', value: twoChar });
                i += 2;
                continue;
            }
        }
        
        if ('+-*/=<>!(){}[];,.~'.includes(char)) {
            tokens.push({ type: 'operator', value: char });
            i++;
            continue;
        }
        
        if (/[a-zA-Z_]/.test(char)) {
            let value = '';
            while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) {
                value += code[i];
                i++;
            }
            
            if (keywords.has(value)) tokens.push({ type: 'keyword', value: value });
            else tokens.push({ type: 'identifier', value: value });
            continue;
        }
        
        console.warn(`Unknown character: ${char} at position ${i}`);
        i++;
    }
    
    return tokens;
}

export class Parser {
    public tokens: Token[];
    public current: number;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
        this.current = 0;
    }
    
    peek(): Token | undefined {
        return this.tokens[this.current];
    }
    
    advance(): Token {
        if (this.current < this.tokens.length) this.current++;
        return this.tokens[this.current - 1];
    }
    
    match(...values: string[]): boolean {
        for (const value of values) {
            if (this.checkOperator(value)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    
    check(value: string): boolean {
        if (this.isAtEnd()) return false;
        return this.peek()?.value === value;
    }
    
    checkOperator(value: string): boolean {
        if (this.isAtEnd()) return false;
        const token = this.peek();
        return token?.type === 'operator' && token?.value === value;
    }
    
    checkKeyword(value: string): boolean {
        if (this.isAtEnd()) return false;
        const token = this.peek();
        return token?.type === 'keyword' && token?.value === value;
    }
    
    matchOperator(value: string): boolean {
        if (this.checkOperator(value)) {
            this.advance();
            return true;
        }
        return false;
    }
    
    isAtEnd(): boolean {
        return this.current >= this.tokens.length;
    }
    
    parse(): ProgramNode {
        const statements: StatementNode[] = [];
        while (!this.isAtEnd()) {
            const stmt = this.statement();
            if (stmt) statements.push(stmt);
        }
        return { type: 'program', statements };
    }
    
    statement(): StatementNode | null {
        if (this.checkKeyword('event')) return this.eventStatement();
        if (this.checkKeyword('if')) return this.ifStatement();
        if (this.checkKeyword('while')) return this.whileStatement();
        if (this.checkKeyword('repeat')) return this.repeatStatement();
        if (this.checkKeyword('for')) return this.forStatement();
        return this.expressionStatement();
    }
    
    eventStatement(): EventStatementNode {
        this.advance();
        if (!this.matchOperator('(')) throw new Error(`Expected '(' after event`);
        const eventType = this.advance();
        if (!this.matchOperator(')')) throw new Error(`Expected ')' after event name`);
        const body = this.blockStatement();
        
        return {
            type: 'event',
            eventType: eventType.value,
            body: body
        };
    }
    
    ifStatement(): IfStatementNode {
        this.advance();
        if (!this.matchOperator('(')) throw new Error(`Expected '(' after if/elif`);
        const condition = this.expression();
        if (!this.matchOperator(')')) throw new Error(`Expected ')' after if condition`);
        const thenBranch = this.blockStatement();
        
        let elseBranch: StatementNode | null = null;
        if (this.checkKeyword('elif') || this.checkKeyword('else')) {
            if (this.checkKeyword('elif')) {
                elseBranch = this.ifStatement();
            } else {
                this.advance();
                elseBranch = this.blockStatement();
            }
        }
        
        return {
            type: 'if',
            condition: condition,
            thenBranch: thenBranch,
            elseBranch: elseBranch
        };
    }
    
    whileStatement(): WhileStatementNode {
        this.advance();
        if (!this.matchOperator('(')) throw new Error(`Expected '(' after while`);
        const condition = this.expression();
        if (!this.matchOperator(')')) throw new Error(`Expected ')' after while condition`);
        const body = this.blockStatement();
        
        return {
            type: 'while',
            condition: condition,
            body: body
        };
    }
    
    repeatStatement(): RepeatStatementNode {
        this.advance();
        if (!this.matchOperator('(')) throw new Error(`Expected '(' after repeat`);
        const amount = this.expression();
        if (!this.matchOperator(')')) throw new Error(`Expected ')' after repeat amount`);
        const body = this.blockStatement();
        
        return {
            type: 'repeat',
            amount: amount,
            body: body
        };
    }
    
    forStatement(): ForStatementNode {
        this.advance();
        if (!this.matchOperator('(')) throw new Error(`Expected '(' after for`);
        const variable = this.primary();
        if (variable.type !== "identifier")
            throw new Error(`Expected variable as first argument`);
        if (!this.matchOperator(',')) throw new Error(`Expected ',' after for variable`);
        const array = this.expression();
        if (!this.matchOperator(')')) throw new Error(`Expected ')' after for array`);
        const body = this.blockStatement();
        
        return {
            type: 'for',
            variable: variable as IdentifierNode,
            array: array,
            body: body
        };
    }
    
    blockStatement(): BlockStatementNode {
        if (!this.matchOperator('{')) throw new Error(`Expected '{' to start block`);
        const statements: StatementNode[] = [];
        
        while (!this.checkOperator('}') && !this.isAtEnd()) {
            const stmt = this.statement();
            if (stmt) statements.push(stmt);
        }
        
        if (!this.matchOperator('}')) throw new Error(`Expected '}' to end block`);
        return { type: 'block', statements };
    }
    
    expressionStatement(): ExpressionStatementNode {
        const expr = this.expression();
        if (this.checkOperator(';')) this.advance();
        return { type: 'expressionStatement', expression: expr };
    }
    
    expression(): ExpressionNode {
        return this.assignment();
    }
    
    assignment(): ExpressionNode {
        const expr = this.logicalOr();
        
        if (this.match('=', '+=', '-=', '*=', '/=')) {
            const operator = this.tokens[this.current - 1];
            const value = this.assignment();
            return {
                type: 'assignment',
                operator: operator.value,
                left: expr,
                right: value
            } as AssignmentExpressionNode;
        }
        
        return expr;
    }
    
    logicalOr(): ExpressionNode {
        return this.logicalAnd();
    }
    
    logicalAnd(): ExpressionNode {
        return this.equality();
    }
    
    equality(): ExpressionNode {
        let expr = this.comparison();
        
        while (this.match('==', '!=')) {
            const operator = this.tokens[this.current - 1];
            const right = this.comparison();
            expr = {
                type: 'binary',
                operator: operator.value,
                left: expr,
                right: right
            } as BinaryExpressionNode;
        }
        
        return expr;
    }
    
    comparison(): ExpressionNode {
        let expr = this.term();
        
        while (this.match('<', '>', '<=', '>=')) {
            const operator = this.tokens[this.current - 1];
            const right = this.term();
            expr = {
                type: 'binary',
                operator: operator.value,
                left: expr,
                right: right
            } as BinaryExpressionNode;
        }
        
        return expr;
    }
    
    term(): ExpressionNode {
        let expr = this.factor();
        
        while (this.match('+', '-')) {
            const operator = this.tokens[this.current - 1];
            const right = this.factor();
            expr = {
                type: 'binary',
                operator: operator.value,
                left: expr,
                right: right
            } as BinaryExpressionNode;
        }
        
        return expr;
    }
    
    factor(): ExpressionNode {
        let expr = this.unary();
        
        while (this.match('*', '/')) {
            const operator = this.tokens[this.current - 1];
            const right = this.unary();
            expr = {
                type: 'binary',
                operator: operator.value,
                left: expr,
                right: right
            } as BinaryExpressionNode;
        }
        
        return expr;
    }
    
    unary(): ExpressionNode {
        if (this.match('!', '-', "+")) {
            const operator = this.tokens[this.current - 1];
            const right = this.unary();
            return {
                type: 'unary',
                operator: operator.value,
                operand: right
            } as UnaryExpressionNode;
        }
        
        return this.call();
    }
    
    call(): ExpressionNode {
        let expr = this.primary();
        
        while (true) {
            if (this.matchOperator('(')) {
                const args: ExpressionNode[] = [];
                if (!this.checkOperator(')')) {
                    do args.push(this.expression());
                    while (this.matchOperator(','));
                }
                if (!this.matchOperator(')')) throw new Error(`Expected ')' after function arguments`);
                expr = {
                    type: 'call',
                    callee: expr,
                    arguments: args
                } as CallExpressionNode;
            } else if (this.matchOperator('.')) {
                const property = this.advance();
                if (property.type !== 'identifier') throw new Error(`Expected property name after '.', got: ${JSON.stringify(property)}`);
                expr = {
                    type: 'memberAccess',
                    object: expr,
                    property: property.value
                } as MemberAccessExpressionNode;
            } else {
                break;
            }
        }
        
        return expr;
    }
    
    primary(): ExpressionNode {
        if (this.isAtEnd()) throw 'Unexpected end of input';
        
        const token = this.peek();
        
        if (token?.type === 'number') {
            return { type: 'literal', value: this.advance().value } as LiteralNode;
        }
        
        if (token?.type === 'string') {
            return { type: 'literal', value: this.advance().value } as LiteralNode;
        }
        
        if (token?.type === 'identifier') {
            const name = this.advance().value;
            if (name === 'null') return { type: 'literal', value: null } as LiteralNode;
            return { type: 'identifier', name: name } as IdentifierNode;
        }
        
        if (this.checkOperator('(')) {
            const checkpoint = this.current;
            
            this.advance();
            const params: string[] = [];
            let isFunctionDef = true;

            if (this.peek()?.type === 'identifier') {
                do {
                    const paramToken = this.peek();
                    if (paramToken?.type === 'identifier') {
                        params.push(this.advance().value);
                    } else {
                        isFunctionDef = false;
                        break;
                    }
                } while (this.checkOperator(','));
            }
            
            if (isFunctionDef && this.checkOperator(')') && this.tokens[this.current + 1]?.value === '~') {
                this.advance();
                this.advance();
                
                if (!this.matchOperator('{')) {
                    throw new Error(`Expected '{' after '~' in function definition`);
                }
                
                const body: StatementNode[] = [];
                while (!this.checkOperator('}') && !this.isAtEnd()) {
                    const stmt = this.statement();
                    if (stmt) body.push(stmt);
                }
                
                if (!this.matchOperator('}')) {
                    throw new Error(`Expected '}' to end function body`);
                }
                
                return {
                    type: 'function',
                    parameters: params,
                    body: { type: 'block', statements: body }
                } as FunctionExpressionNode;
            } else {
                this.current = checkpoint;
                this.advance();
                const expr = this.expression();
                if (!this.matchOperator(')')) {
                    throw new Error(`Expected ')' after expression, got: ${JSON.stringify(this.peek())}`);
                }
                return expr;
            }
        }
        
        throw new Error(`Unexpected token in primary: ${JSON.stringify(token)} at position ${this.current}`);
    }
}

export function parse(tokens: Token[]): ProgramNode {
    const parser = new Parser(tokens);
    return parser.parse();
}