## M2 - Milestone 2

### Objective

Creating a testing analysis that will blend several techniques, including fuzzing, and snapshot testing and integrating it into the pipeline tool build in M1

The goal of the analysis is to calculate the mutation coverage of a test suite.

1) Provision and configure computing environment
 for pipeline

- `pipeline init` -> initalize a VM and show conection details 
    - It will identify if bakerx or basicvm image exist, if not, will pull it from the source
    - It will identify the processor(Arm64 or AMD and run bakerx or basic vm based on it)
    - Initialize the VM with required configurations

2) Trigger a build job, running steps outlined by build.yml, wait for output, and print build log

- `pipeline build mutation-coverage build.yml` -> run mutation-coverage job to execute mutation functions and obtain new snapshots with mutated files


The service tested is: [microservice](https://github.com/chrisparnin/checkbox.io-micro-preview.git)

The test marqdown files are:
- test/resources/long.md
- test/resources/survey.md
- test/resources/upload.md
- test/resources/variations.md

The mutation operators covered are:

- Conditional boundary mutations: `>` => `>=`, `<` => `<=`
- Incremental mutations: `++j` =>`j++`, `i++` => `i--`
- Negate conditionals: `==` => `!=`, `<` => `>`
- Mutate control flow `if` => `else if`
- Conditional expression mutation `&&` => `||`, `||`=> `&&`
- Clone return, early Find: shift position of `return`
- Non-empty string: `""` => `"<div>Bug</div>"`.
- Constant Replacement:`0` => `3`
-------------------


### Instructions to Run 💻:

- git clone the [project](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-27.git)
- Create a build.yml file in the root directory of the project or rename the build.yml.template to build.yml
    - Refer to the [template](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-27/blob/main/build.yml.template)
- Create a file named ".env" (please don't add a filename, it's just .env) in the root directory of the project.
   - This file should contain the (your)github access token in the format - `ACCESS_TOKEN="xxxxxxxxx"`
- Modify the iterations tag in the build.yml to run for any number of iterations of your choice. Default value is 10.
- Run the follwing commands
  - npm install
  - node index.js init
  - node index.js build mutation-coverage build.yml
  - node index.js build itrust-build build.yml(optional)
-------

### Build.yml description:

Although most of the build.yml structure is maintained. We added another structure under jobs which can be used to run node js scripts. So we created scripts and arguments which can be used to run js file and if needed send arguments it needs.

--------
### Implementation Description:

In order to do the mutation testing we start the test project using pm2 and enable watch to capture changes without reloading. We take the baseline screenshots once for comparison. For each iteration, we randomly select one of our mutation functions and add a probabilty of performing each possible mutation. This give us a minimal mutation but a possibly unique mutation in each case. Due to this randomness, the results vary each time we run. We were able to get as high as a 22% mutation for 10 iterations. A high extent of mutation leads to a lot of compilation errors. On each run, we keep updating the metrics which capture the number of screenshots that changed due to mutation. We also keep a track of compilation errors. We are calculating the mutation percentage based on the number of screenshots that were different out of the total number of screenshots possible i.e. 4 * number of iterations. We implemented exception handling which helps the code recover even after multiple comilation errors. For the application to rebuild and run, sometimes would take time, to handle that we have introduced a while loop which runs for atmost 3 times and has a delay which allows the application to be loaded on the browser.

----------
### Fixes for M1:

Init:
- Added the shared folder check for basicvm
- Added the verification for focal image

----------------------
### Experience and Challenges

**Integeration**
- Challenges
   - Identifying the workflow with all flow specifications and components.
   - We found issues when trying to integrate Screenshot function into our mutation-coverage function.
   - Handling the promises or async await to execute the code correctly.
   - Starting and stopping the application using pm2 and capturing changes without a restart using --watch.
   - Running the node js application and building and running it on the vm detecting any changes made to the .js files.
   - We had issues with timeout when trying to run for 1000 iterations. We are creating new browser session now and closing all old browser sessions.
   - For the application to rebuild and run, sometimes would take time, to handle that we have introduced a while loop which runs for atmost 3 times and has a delay which allows the application to be loaded on the browser.

**Mutation Operators**

- Experience
   - Insightful learning of the topics - AST, Fuzzing,Mutation coverage,use of Esprima tool, AST parsing,impact of operator change, compilation errors
- Challenges
   - The first challenge was inspecting the code and understanding its corresponding AST . Esprima, a well built javascript parsing tool helped in the visualization of code in an understandable format.
   - The second challenge was experimenting with the different mutation operators to analyse the result of mutated code
   - The third challenge was with a few mutation operator like 'else if' that required more in depth understanding of AST parsing and figuring out how and what in AST should be taken for realizing the change
  - The fourth challenge was even after mutating changes were not reflecting in the code
  - The fifth challenge was randomising the mutations instead of chaging everything based on mutation function. This helped in reducing compilation errors to an extent
  - We are randomly selecting an operation we want to execute for an iteration. We are also randomly choosing a probability to execute the function and also a probability to modify a line. This was giving us relatively decent results compared to our previous tries with mutation operations.

**Build.yml**
- Challenges
   - We wanted to create a function which handles mutation testing. We are doing this by creating mutation-coverage.js. This helps in running the mutation coverage for any given project. We wanted to use build.yml to execute the funtion in the vm, for which we created an additional structure which can be used to run node js script and send arguments to it.




### Screencast

- [Windows Screencast](https://youtu.be/1gfizgRsKWk)
- [Ubuntu Screencast](https://youtu.be/7RI5T9E2s8s)
- [M1 Screencast](https://drive.google.com/file/d/1VhDnRobllLnIvJwiajdkXlt2WUgRULW5/view?usp=sharing)

### 1000 Run Results
- [Results: mutation_metrics & screenshots](https://drive.google.com/file/d/1VhDnRobllLnIvJwiajdkXlt2WUgRULW5/view?usp=sharing)
- [Screencast for results](https://drive.google.com/file/d/1adrj3c0kgQpNVh2gfOchLydZ2Y63D5uV/view?usp=sharing)
