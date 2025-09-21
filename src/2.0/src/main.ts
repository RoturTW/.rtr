import { ProgramNode, parse, tokenize } from './ast';
import type { EventStatementNode, BlockStatementNode, StatementNode, ExpressionNode, ExpressionStatementNode, CallExpressionNode, LiteralNode, IdentifierNode, UnaryExpressionNode, BinaryExpressionNode, BinaryOperator, UnaryOperator, FunctionExpressionNode, AssignmentExpressionNode, MemberAccessExpressionNode, WhileStatementNode, IfStatementNode, RepeatStatementNode, ForStatementNode } from './ast';

type RTRPlatform = { name: string, version: string };
type RTRScopeLayer = Record<string, any>;

class RTRScope {
    public layers: RTRScopeLayer[];

    constructor(platform: RTRPlatform) {
        this.layers = [{
            platform,
            rtr: { version: "2.0", environment: { type: "typescript / javascript", } },
            mouse: { x: 0, y: 0, down: false, clicked: false, moved: false },
            keysdown: [],

            'true': true,
            'false': false,

            // @ts-ignore
            log: (...args) => console.log(...args),
            // @ts-ignore
            min: (...args) => Math.min(...args),
            // @ts-ignore
            max: (...args) => Math.max(...args),
            // @ts-ignore
            abs: (x) => Math.abs(x),
            // @ts-ignore
            round: (x) => Math.round(x),
            // @ts-ignore
            floor: (x) => Math.floor(x),
            // @ts-ignore
            ceil: (x) => Math.ceil(x),
            // @ts-ignore
            sqrt: (x) => Math.sqrt(x),
            // @ts-ignore
            sin: (x) => Math.sin(x),
            // @ts-ignore
            cos: (x) => Math.cos(x),
            // @ts-ignore
            tan: (x) => Math.tan(x),
            // @ts-ignore
            asin: (x) => Math.asin(x),
            // @ts-ignore
            acos: (x) => Math.acos(x),
            // @ts-ignore
            atan: (x) => Math.atan(x),
            // @ts-ignore
            join: (...arr) => arr.join(""),
            // @ts-ignore
            split: (str, sep) => str.split(sep),
            // @ts-ignore
            keys: (obj) => Object.keys(obj),
            // @ts-ignore
            values: (obj) => Object.values(obj),
            // @ts-ignore
            length: (obj) => obj.length,
            // @ts-ignore
            item: (obj, index) => obj[index],
            // @ts-ignore
            typeof: (x) => typeof x,
            // @ts-ignore
            range: (start, end) => Array.from({ length: end - start + 1 }, (_, i) => start + i),
            // @ts-ignore
            input: (msg) => prompt(msg),
            // @ts-ignore
            chr: (x) => String.fromCharCode(x),
            // @ts-ignore
            ord: (x) => x.charCodeAt(0),
            // @ts-ignore
            not: (x) => !x,
            // @ts-ignore
            set: (obj, key, val) => (obj[key] = val, obj),
            obj: () => ({}),
            // @ts-ignore
            del: (obj, key) => (delete obj[key], obj),
            // @ts-ignore
            has: (obj, key) => obj.hasOwnProperty(key),
            // @ts-ignore
            all: (...args) => args.every(Boolean),
            // @ts-ignore
            any: (...args) => args.some(Boolean),
            // @ts-ignore
            return: (val) => this.set("@return_val", val),
            // @ts-ignore
            toNum: (x) => x | 0,
            // @ts-ignore
            toStr: (x) => "" + x,
        }];
    }

    public addLayer(layer: RTRScopeLayer = {}) {
        this.layers.push(layer);
    }
    public popLayer(): RTRScopeLayer {
        if (this.layers.length < 1) throw "no layers to pop";
        return this.layers.pop()!;
    }

    public get(name: string): any {
        for (let i = this.layers.length - 1; i >= 0; i--) {
            const element = this.layers[i];
            if (element[name] !== undefined)
                return element[name];
        }
        return null;
    }
    public set(name: string, value: any) {
        for (let i = this.layers.length - 1; i >= 0; i--) {
            const layer = this.layers[i];
            if (layer[name] !== undefined) {
                layer[name] = value;
                return;
            }
        }
        const top = this.layers[this.layers.length - 1];
        top[name] = value;
    }
    public has(name: string): boolean {
        for (let i = this.layers.length - 1; i >= 0; i--) {
            const element = this.layers[i];
            if (element[name] !== undefined)
                return true;
        }
        return false;
    }
}

export class RTR {
    public ast: ProgramNode;

    public scope: RTRScope;

    public unaryOperators: Record<UnaryOperator, (operand: any) => any> = {
        "!": (operand) => !operand,
        "-": (operand) => -operand,
        "+": (operand) => +operand
    }
    public binaryOperators: Record<BinaryOperator, (left: any, right: any) => any> = {
        "==": (a, b) => a === b,
        "!=": (a, b) => a !== b,
        ">=": (a, b) => a >= b,
        "<=": (a, b) => a <= b,
        ">": (a, b) => a > b,
        "<": (a, b) => a < b,
        "+": (a, b) => a + b,
        "-": (a, b) => a - b,
        "*": (a, b) => a * b,
        "/": (a, b) => a / b,
    }
    //"%": (a, b) => ((a % b) + b) % b,
    //"^": (a, b) => a ** b,
    //"?": (a, b, c) => a ? b : c,

    constructor(platform: RTRPlatform, code: string | ProgramNode) {
        if (typeof code === "string")
            code = parse(tokenize(code));
        this.ast = code;
        this.scope = new RTRScope(platform);

        this.runEvent("onload");
    }

    public runEvent(name: string, scope: RTRScopeLayer = {}) {
        const events: EventStatementNode[] = (this.ast.statements as EventStatementNode[]).filter(e => e.eventType === name);
        if (!events) return;

        const event = events[0];
        if (events.length > 1) console.warn(`Duplicate ${event.eventType} event`);

        this.runBlock(event.body, scope);
    }

    public runBlock(node: BlockStatementNode, scopeLayer: RTRScopeLayer = {}): any {
        this.scope.addLayer(scopeLayer);

        let out;
        for (let i = 0; i < node.statements.length; i++) {
            const element = node.statements[i];
            this.runStatement(element);
            if (this.scope.has("@return_val"))
                break;
        }

        return this.scope.popLayer()["@return_val"] ?? null;
    }

    public runStatement(node: StatementNode): any {
        switch (node.type) {
            case "expressionStatement":
                this.runExpression((node as ExpressionStatementNode).expression);
                break;
            case "if": {
                if (this.runExpression((node as IfStatementNode).condition))
                    return this.runBlock((node as IfStatementNode).thenBranch);
                else if ((node as IfStatementNode).elseBranch?.type === "block")
                    return this.runBlock((node as IfStatementNode).elseBranch as BlockStatementNode);
                else if ((node as IfStatementNode).elseBranch)
                    return this.runStatement((node as IfStatementNode).elseBranch!);
                return null;
            }
            case "while": {
                while (this.runExpression((node as WhileStatementNode).condition)) {
                    const out = this.runBlock((node as WhileStatementNode).body);
                    if (out)
                        return out;
                }
                return null;
            }
            case "repeat": {
                const amount = this.runExpression((node as RepeatStatementNode).amount);
                for (let index = 0; index < amount; index++) {
                    const out = this.runBlock((node as WhileStatementNode).body);
                    if (out)
                        return out;
                }
                return null;
            }
            case "for": {
                const array = this.runExpression((node as ForStatementNode).array);
                const varName = (node as ForStatementNode).variable.name;
                const scope: RTRScopeLayer = {};
                for (let i = 0; i < array.length; i++) {
                    const element = array[i];
                    scope[varName] = element;
                    const out = this.runBlock(
                        (node as ForStatementNode).body,
                        scope
                    );
                    if (out)
                        return out;
                }
                return null;
            }
            default:
                throw new Error(`Cannot run statement of type ${node.type}`);
        }
    }

    public runExpression(node: ExpressionNode): any {
        switch (node.type) {
            case "call": { // func(args)
                const args = (node as CallExpressionNode).arguments
                    .map(a => this.runExpression(a));
                const callee = (node as CallExpressionNode).callee;
                let func;
                let parent: Record<string, any> | null = null;
                if (callee.type == "memberAccess") {
                    parent = this.runExpression((callee as MemberAccessExpressionNode).object);
                    func = parent![(callee as MemberAccessExpressionNode).property];
                } else {
                    func = this.runExpression(callee);
                }

                if (func["@rwlType"] === "func") {
                    const layer = Object.fromEntries(
                        (func["parameters"] as string[]).map((p, i) => [p, args[i] ?? null]),
                    );
                    if (parent != null)
                        layer["this"] = parent;
                    this.scope.addLayer(layer);
                    const out = this.runBlock(func.body);
                    this.scope.popLayer();
                    return out;
                }

                if (!(func instanceof Function))
                    throw new Error(`cannot call non-function`);

                return func(...args) ?? null;
            }
            case "literal": // "string" or 5 or null
                return (node as LiteralNode).value;
            case "identifier": // varName
                return this.scope.get((node as IdentifierNode).name);
            case "binary": {
                const left = this.runExpression((node as BinaryExpressionNode).left);
                const right = this.runExpression((node as BinaryExpressionNode).right);
                const run = this.binaryOperators[(node as BinaryExpressionNode).operator];
                return run(left, right);
            }
            case "unary": {
                const operand = this.runExpression((node as UnaryExpressionNode).operand);
                const run = this.unaryOperators[(node as UnaryExpressionNode).operator];
                return run(operand);
            }
            case "function": {
                return this.createFunction(
                    (node as FunctionExpressionNode).parameters,
                    (node as FunctionExpressionNode).body
                );
            }
            case "assignment": {
                const left = (node as AssignmentExpressionNode).left;
                const right = this.runExpression((node as AssignmentExpressionNode).right);

                let assignVal = right;
                switch ((node as AssignmentExpressionNode).operator) {
                    case "+=":
                        assignVal = this.runExpression(left) + right;
                        break;
                    case "-=":
                        assignVal = this.runExpression(left) - right;
                        break;
                    case "*=":
                        assignVal = this.runExpression(left) * right;
                        break;
                    case "/=":
                        assignVal = this.runExpression(left) / right;
                        break;
                }

                if (left.type == "identifier")
                    this.scope.set((left as IdentifierNode).name, assignVal);
                else if (left.type == "memberAccess") {
                    const obj = this.runExpression((left as MemberAccessExpressionNode).object);
                    obj[(left as MemberAccessExpressionNode).property] = assignVal;
                }
                return right;
            }
            case "memberAccess": {
                const obj = this.runExpression((node as MemberAccessExpressionNode).object);
                return obj[(node as MemberAccessExpressionNode).property];
            }
            default:
                console.error(node);
                throw new Error(`Cannot run expression of type ${node.type}`);
        }
    }

    public createFunction(parameters: string[], body: BlockStatementNode) {
        return { "@rwlType": "func", parameters, body };
    }
}

/* example
const inst = new RTR({ name: "node", version: "1" },`
event (onload) {
    a = 0
    b = 1
    c = 0
    for (i, range(1, 9)) {
        c = a + b;
        a = b;
        b = c;
    }
    log(c);
}
`);
*/