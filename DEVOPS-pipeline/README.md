# F0 (Usage of end-to-end pipeline in two new jobs)

## New Pipeline Jobs

1) `SLASH` - Follow the [Readme.md](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-27/blob/F0-aaakrit/Slash_Job1_README.md) for complete insight and instructions to run the Job using the existing pipeline

2) `PENCILBLUE` - Follow the [Readme.md](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-27/blob/F0-aaakrit/Pencilblue_Job2_README.md) for complete insight and instructions to run the Job using the existing pipeline

-----------

## New Feature

### Static Analysis

 It is a method of debugging by examining source code before a program is run.It is used for validating basic properties of the code
 Our code is analysed with a parsing technology that creates an AST
 (Abstract Syntax Tree)

 ## Design Patterns

 The two design patterns used are:

- A Visitor pattern, which is used to abstract the process of visiting a data structure such as our abstract syntax tree (AST).This will visit each node inside the AST, and repeatly callback the given function with each node of the tree.  this enables a  selectively "visit" nodes of interest, while ignoring the others and without any knowledge of traversal.


<img src = Screenshots/snip1.png >

- A Builder pattern, which is used to build up state and then finally emit. Meaning, we can incrementally calculate results as with process the AST.As we're collecting information incrementally as we visit AST nodes, we need a way to store these partial results, before making a final analysis decision.

<img src = Screenshots/snip2.png >

### Properties used in the Analysis 

**File Properties**

1) <b>PackageCount</b>: The number of imports used in the file.
2) <b>StringCount</b>: The number of string literals in the entire code file.

**Function Properties**

1) <b>ParameterCount</b>: The number of parameters in a function.
2) <b>MethodLength</b>: The number of lines in a function.
3) <b>SimpleCyclomaticComplexity</b>: The number of decision statements in a function
4) <b>NestedFunctions</b>: The number of Function inside another function

**Reference snapshot of the implementation**

   <img src = Screenshots/reference.png >


### Analysis
- Parametercount and Cyclometic complexity is represented with Green color as they both are in the range of threshold
- Length and NestedFunctions are in Yellow to depict they are in warning threshold

This color-coding represntation help to identify and catch the undesired behaviours and could be corrected before actually running the program. A function Length is `345`, so it is not an expected length, therefore it could be changed or broken down to avoid these undesired behaviours.


### How To Run

This Feature is demonstrated for Pipeline Job2 - Pencilblue, therefore 

<b>Assumption:</b>

- VM is already created using `node index.js init`
- `pencilblue-build` is completed successfully to have `pencilblue` repo in our VM

<b> Now RUN</b>
- `node index.js build static-analysis build.yml` to run the new feature inside the VM

- This will display the static analysis for the pencilblue.js file

Note: To run other file, update the build.yml -> `static-analysis` run instruction and give the file name as `node analysis.js <filename.js>` given that file is there in VM

Also, To test any other file and not using pencilblue repo, then append the build job to install `nodejs` and `npm` and provide the file name with location to run this feature independently


## Screencast

[New Feature](https://drive.google.com/file/d/11_T-NkHvJcmDFvEINkdtFl5PQdY9yypx/view)










