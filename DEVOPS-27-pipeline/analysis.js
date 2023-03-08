const esprima = require("esprima")
const options = { tokens: true, tolerant: true, loc: true, range: true }
const fs = require("fs")
const chalk = require("chalk")
const { count } = require("console")

function main() {
  var args = process.argv.slice(2)

  if (args.length == 0) {
    // default value is self if no other script is provided.
    args = ["analysis.js"]
    
  }
  // takes the first passed argument on command line
  var filePath = args[0]
  
  console.log(chalk.greenBright("Parsing ast and running static analysis..."))
  console.log(chalk.greenBright("--------------------------------------------"))

  var builders = {}
  Static_analysis(filePath, builders)
  
  // Report the file level data
  for (var node in builders) {
    var builder = builders[node]
    builder.report()
  }
}

function Static_analysis(filePath, builders) {
  // Reading the file and parsing ast
  var buf = fs.readFileSync(filePath, "utf8")
  var ast = esprima.parse(buf, options)

  var i = 0

  // Initialize builder for file-level information
  var fileBuilder = new FileBuilder()
  fileBuilder.FileName = filePath
  builders[filePath] = fileBuilder
  
  // Traverse program with a function visitor.
  traverseWithParents(ast, function (node) {
    // File level calculations

    // 1. Strings
    if (node.type === "Literal" && typeof node.value === "string") {
      fileBuilder.Strings++
    }

    // 2. Packages
    if (node.type === "CallExpression" && node.callee.name === "require") {
      fileBuilder.ImportCount++
    }

    if (node.type === "FunctionDeclaration") {
      var builder = new FunctionBuilder()

      builder.FunctionName = functionName(node)
      builder.StartLine = node.loc.start.line
      // Calculate function level properties.
      
      // 1. Parameters
      builder.ParameterCount = node.params.length

      // 2. Method Length
      builder.Length = node.loc.end.line - node.loc.start.line

      // 3.Nested functions
      traverseWithParents(node, function (child) {
        if (child.type === "FunctionExpression") {
          builder.NestedFunctions++
        }
      })

      // 4. CyclomaticComplexity
      traverseWithParents(node, function (child) {
        if (child.type === "IfStatement") {
          builder.SimpleCyclomaticComplexity++
        }
      })
      builders[builder.FunctionName] = builder
    }
  })
}

  class FunctionBuilder {
    constructor() {
  
      this.StartLine = 0
      this.FunctionName = ""
      // The number of parameters for functions
      this.ParameterCount = 0
      // The number of lines.
      this.Length = 0
      // Number of if statements/loops + 1
      this.SimpleCyclomaticComplexity = 1
      // The number of nested functions
      this.NestedFunctions = 0
      
    }
    threshold() {
      const thresholds = {
        SimpleCyclomaticComplexity: [
          { t: 15, color: "red" },
          { t: 13, color: "yellow" },
        ],
        NestedFunctions: [
          { t: 35, color: "red" },
          { t: 15, color: "yellow" },
        ],
        ParameterCount: [
          { t: 10, color: "red" },
          { t: 3, color: "yellow" },
        ],
        Length: [
          { t: 400, color: "red" },
          { t: 10, color: "yellow" },
        ],
      }

      const showScore = (id, value) => {
        let scores = thresholds[id]
        const lowestThreshold = { t: 0, color: "green" }
        const score =
          scores
            .sort((a, b) => {
              a.t - b.t
            })
            .find((score) => score.t <= value) || lowestThreshold
        return score.color
      }

      this.NestedFunctions = chalk`{${showScore("NestedFunctions", this.NestedFunctions)} ${this.NestedFunctions}}`
      this.Length = chalk`{${showScore("Length", this.Length)} ${this.Length}}`
      this.ParameterCount = chalk`{${showScore(
        "ParameterCount",
        this.ParameterCount
      )} ${this.ParameterCount}}`
      this.SimpleCyclomaticComplexity = chalk`{${showScore(
        "SimpleCyclomaticComplexity",
        this.SimpleCyclomaticComplexity
      )} ${this.SimpleCyclomaticComplexity}}`
    }

    report() {
      this.threshold()

      console.log(
        chalk`{blue.underline ${this.FunctionName}}(): at line #${this.StartLine}
Parameters: ${this.ParameterCount}\tLength: ${this.Length}
Cyclomatic: ${this.SimpleCyclomaticComplexity}\tNestedFunctions: ${this.NestedFunctions}\n`
       
      )
    }
  }

  // A builder for storing file level information.
  function FileBuilder() {
    this.FileName = ""
    // Number of strings in a file.
    console.log(chalk.greenBright("-----------------------------------------"))
    console.log(chalk.yellow("File Level Calculations"))
    console.log(chalk.greenBright("-----------------------------------------") )
    this.Strings = 0
    // Number of imports in a file.
    this.ImportCount = 0

    this.report = function () {
      console.log(
        chalk`{magenta.underline ${this.FileName}}
Packages: ${this.ImportCount}
Strings ${this.Strings}
`
        
      )
      console.log(
        chalk.greenBright("-----------------------------------------")
      )
      console.log(chalk.yellow("Function Level Calculations"))
      console.log(
        chalk.greenBright("--------------------------------------------")
      )
    }
  }

  // A function following the Visitor pattern.
  // Annotates nodes with parent objects.
  function traverseWithParents(object, visitor) {
    var key, child

    visitor.call(null, object)

    for (key in object) {
      if (object.hasOwnProperty(key)) {
        child = object[key]
        if (typeof child === "object" && child !== null && key != "parent") {
          child.parent = object
          traverseWithParents(child, visitor)
        }
      }
    }
  }

  // Helper function for counting children of node.
  function childrenLength(node) {
    var key, child
    var count = 0
    for (key in node) {
      if (node.hasOwnProperty(key)) {
        child = node[key]
        if (typeof child === "object" && child !== null && key != "parent") {
          count++
        }
      }
    }
    return count
  }


  // Helper function for printing out function name.
  function functionName(node) {
    if (node.id) {
      return node.id.name
    }
    return "anon function @" + node.loc.start.line 
  }

  main()
  exports.main = main