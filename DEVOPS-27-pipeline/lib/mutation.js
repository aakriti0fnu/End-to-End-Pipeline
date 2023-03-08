const fs = require('fs');
const Random = require("random-js");
const esprima = require("esprima");
const escodegen = require("escodegen");
const chalk = require("chalk");
const options = { tokens: true, tolerant: true, loc: true, range: true }

const mutationFunctions = [GreaterThanOperator, returnStatementReorder, isDecision, NegateConditionals, andOperator, iteratorOperator, incrementOperator, lessThanOperator, emptyString, constant, textToBlank]

let randomWeight_func;
let randomWeight_line;
// isDecision
class mutator {
    static random() {
        return mutator._random;
    }

    static seed(kernel) {
        mutator._random = new Random.Random(
            Random.MersenneTwister19937.seed(kernel)
        )
        return mutator._random
    }
}

mutator.seed(0);


function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}

async function mutateFile(ast) {
    let mutation = mutationFunctions[getRandomInt(mutationFunctions.length)];
    randomWeight_func = Math.random() * 0.75;
    randomWeight_line = Math.random() * 0.5;
    await mutation(ast);
}

exports.mutate = async function(jsFiles, mutation_metrics) {
    for (let file of jsFiles) {
        if(!file.endsWith("index.js")){
            try {

                let buf = fs.readFileSync(file, "utf8");
                let ast = await esprima.parse(buf, options)

                await mutateFile(ast);

                try {
                    let code = await escodegen.generate(ast)
                    let resp = await fs.writeFileSync(file, code)
                } catch (e) {
                    console.log("Compilation of code and write failed");
                }


                console.log(`Mutation of ${file} complete`);
            } catch (e) {
                console.log("Failed to fetch the js file.")
            }
        }
    }
}

function traverseWithParents(object, visitor) {
    var key, child

    visitor.call(null, object)

    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key]
            if (
                typeof child === "object" &&
                child !== undefined && child!== null &&
                key != "parent"
            ) {
                child.parent = object
                traverseWithParents(child, visitor)
            }
        }
    }
}

/************
 * Mutators *
 ************/

async function textToBlank(ast) {
    await traverseWithParents(ast, (node) => {
        if(node !== undefined &&  node.argument !== undefined && mutator.random().bool(randomWeight_func)){
            if(node.type==="ReturnStatement"){
                if(node.argument.name==="text" && mutator.random().bool(randomWeight_line)){
                    console.log(chalk.red("Sending empty string instead of value"));
                    node.argument.type = "Literal";
                    node.argument.value = "";
                    node.argument.raw = "\"\""
                }
            }
        }
    })
}

async function GreaterThanOperator(ast) {
     await traverseWithParents(ast, (node) => {
         if (node !== undefined && mutator.random().bool(randomWeight_func)) {
             if (node.operator == ">" && mutator.random().bool(randomWeight_line)) {
                 node.operator = ">="
                 console.log(
                     chalk.blue(`Mutated > with >= on line ${node.loc.start.line}`)
                 )
             }
         }
    })

}

// Helper function for mutating a iterator operator "++j" with "j++"
async function incrementOperator(ast) {

    await traverseWithParents(ast, (node) => {
        if (node !== undefined && mutator.random().bool(randomWeight_func)) {
            if (node.operator == "++" && mutator.random().bool(randomWeight_line)) {
                node.prefix = false
                console.log(
                    chalk.red(
                        `Mutated iterator ++j with j++ on line ${node.loc.start.line}`
                    )
                )
            }
        }
    })
}

// Helper function for mutating a iterator operator "i++" with "i--"
async function iteratorOperator(ast) {

    await traverseWithParents(ast, (node) => {
        if (node !== undefined && mutator.random().bool(randomWeight_func)) {
            if (node.operator == "++" && mutator.random().bool(randomWeight_line)) {
                node.operator = "--"
                console.log(
                    chalk.red(`Mutated ++ with -- on line ${node.loc.start.line}`)
                )
            }
        }
    })
}

// Helper function for mutating a conditional operator "<" with "<="
async function lessThanOperator(ast) {


    await traverseWithParents(ast, (node) => {
        if (node !== undefined && mutator.random().bool(randomWeight_func)) {
            if (node.operator == "<" && mutator.random().bool(randomWeight_line)) {
                node.operator = "<="
                console.log(chalk.green(`Mutated < with <= on line ${node.loc.start.line}`))
            }
        }
    })

}

// Helper function for mutating a && with ||
async function andOperator(ast) {

    await traverseWithParents(ast, (node) => {
        if (node !== undefined && mutator.random().bool(randomWeight_func)) {
            if (node.operator == "&&" && mutator.random().bool(randomWeight_line)) {
                node.operator = "||"
                console.log(
                    chalk.yellow(`Mutated && with || on line ${node.loc.start.line}`)
                )
            }
        }
    })
}

// Helper function for mutating a negate operator
async function NegateConditionals(ast) {
    await traverseWithParents(ast, (node) => {
        if (node !== undefined && mutator.random().bool(randomWeight_func)) {
            if (node.operator == "==" && mutator.random().bool(randomWeight_line)) {
                node.operator = "!=";
                console.log(chalk.blue(`Mutated == with != on line ${node.loc.start.line}`));
            }
            if (node.operator == "<" && mutator.random().bool(randomWeight_line)) {
                node.operator = ">"
                console.log(chalk.blue(`Mutated < with > on line  ${node.loc.start.line}`))
            }
        }
    })
}

// Helper function for replacing an empty string with html tag
async function emptyString(ast) {

    await traverseWithParents(ast, (node) => {
        if (node !== undefined && mutator.random().bool(randomWeight_func)) {
            if (node.type == "Literal" && node.value == "" && mutator.random().bool(randomWeight_line)) {
                node.value = "<div>BUG</div>"
                console.log(
                    chalk.red(
                        `Mutated "" empty string with "<div>BUG</div>" on line ${node.loc.start.line}`
                    )
                )
            }
        }
    })
}

// Helper function for mutating a constant value with other constant value
async function constant(ast) {

    await traverseWithParents(ast, (node) => {
        if (node !== undefined && mutator.random().bool(randomWeight_func)) {
            if (
                node.type == "Literal" && node.value == 0 && mutator.random().bool(randomWeight_line)) {
                node.value = 3
                console.log(chalk.green(`Replacing a constant with another constant on line ${node.loc.start.line}`))
            }
        }
    })
}


// Helper function for changing 'if' to 'else if'
async function isDecision(ast) {
    await traverseWithParents(ast, (node) => {
        if (node !== undefined && mutator.random().bool(randomWeight_func)) {
            if (node.type == "BlockStatement" && mutator.random().bool(randomWeight_line)) {
                let ifArray = node.body
                for (let i = 0; i < ifArray.length - 1; i++) {
                    if (ifArray[i].type == "IfStatement" && ifArray[i + 1].type == "IfStatement") {
                        ifArray[i].alternate = ifArray[i + 1]
                        ifArray.splice(i + 1, 1)
                        console.log(chalk.green(`Replacing 'if' with 'else if' constant on line ${node.loc.start.line}`))
                    }
                }
            }
        }
    })
}

// Helper function to shift the position of return
async function returnStatementReorder(ast) {
    await traverseWithParents(ast, (node) => {
        if (node !== undefined && mutator.random().bool(randomWeight_func)) {
            if (node.type == "BlockStatement" && mutator.random().bool(randomWeight_line)) {
                console.log(chalk.blue(node.type))

                let returnArray = node.body

                for (let i = 0; i < returnarray.length; i++) {
                    if (returnArray[i].type == "ReturnStatement" && i != 0) {
                        console.log(chalk.yellow(returnArray[i].type))
                        returnArray[i - 2] = returnArray[i]
                        returnArray.splice(i, 1)
                        console.log(
                            chalk.green(`Changed the position of return ${node.loc.start.line}`)
                        )
                    }

                }
            }
        }
    })
}
