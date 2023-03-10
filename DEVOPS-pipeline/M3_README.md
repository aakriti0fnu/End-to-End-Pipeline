## M3 - Milestone 3

### Objective

Implementing a deployment strategy into a production environment and integrating into your pipeline tool.
The deployment strategy used is blue/green deployment .


1) Provision and configure computing environment for pipeline

- `pipeline init` -> initalize a VM and show conection details 
    - It will identify if bakerx or basicvm image exist, if not, will pull it from the source
    - It will identify the processor(Arm64 or AMD and run bakerx or basic vm based on it)
    - Initialize the VM with required configurations

2) Trigger a build job, running steps outlined by build.yml, wait for output, and print build log

- `pipeline build iTrust-build build.yml` -> run itrust-build job to install the Itrust application and related dependencies.

3) Provision cloud instances

- `pipeline prod up` -> Initializing the cloud instance on Digital Ocean Droplet as BLUE and GREEN servers to deploy iTrust.It return the inventory details with Cloud server IP addresses.


4) Trigger a deployment, running steps outlined by build.yml, wait for output, print log, and determine success or failure.

- `pipeline deploy ./inventory.txt itrust-deploy build.yml ` -> This is deploying the itrust on the cloud instances using BLUE/GREEN deployment and returning the status as Deployment Success or Deployment Fail
- As part of blue green deployment, initially both the servers are deployed with the same jar, which is generally stable. Once a new feature is developed, the jar thus built can be used to deploy into the GREEN droplet only by just removing BLUE from the servers section of the build job in build.yml.
- Upon monitoring the feature if there is a need to divert traffic to blue we can do so by updating the value of TARGET to BLUE in the proxy.
- This gives us a chance to revert the GREEN server to the stable version.
- Once reverted the traffic is again diverted back to GREEN server.
- If BLUE server has to be updated with latest stable version. The jar name is updated and servers section will only contain BLUE in the build.yml


----------------------------


### Instructions to Run 💻:

- git clone the [project](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-27.git)
- Create a build.yml file in the root directory of the project or rename the build.yml.template to build.yml
    - Refer to the [template](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-27/blob/main/build.yml.template)
- Create a file named ".env" (please don't add a filename, it's just .env) in the root directory of the project.
   - This file should contain the Droplet access token and (your)github access token in the same format 
            - `DROPLET_TOKEN="yyyyyyyy"`
            - `ACCESS_TOKEN="xxxxxxxxx"`
   - The Droplet token should be obtained from [Digital ocean](https://www.digitalocean.com/) account under API -> Tokens/Keys -> Generate access token
- Modify the iterations tag in the build.yml to run for any number of iterations of your choice. Default value is 10.
- Run the follwing commands
  - npm install
  - node index.js init
  - node index.js build itrust-build build.yml
  - node index.js prod up
  - node index.js deploy ./inventory.txt itrust-deploy build.yml
-------

### Build.yml description:

Although most of the build.yml structure is maintained. We added another structure under jobs which can be used to run node js scripts. So we created scripts and arguments which can be used to run js file and if needed send arguments it needs.

We added a few variables to the jobs in build.yml where we require the user to provide the name of the jar that has to be deployed. The port on which the application would run. The url that needs to be hit to check if application is running. The variable servers basically is list of the DO droplets that the jar has to be deployed to.

--------
### Implementation Description:

Firstly we needed to create two droplets which could be ssh'd into. They are called BLUE and GREEN. Once created we have the private ssh key and the ip address related to the droplets. We ssh'd into the droplet and executed a list of commands which were required to execute the jar on the droplet. Once this process was completed on both the droplets, we created an object which handles the health check on the the TARGET droplet, which is GREEN by default. All the traffic is diverted towards GREEN using a proxy. But if the health check starts to throw an error or return 500. The failover is applied and TARGET is switched to BLUE. This way we ensure that service is kept running if any feature or service breaks down.

----------------------
### Experience and Challenges

**Experience**
    - From creating a VM to deploying it on cloud using a deployment strategy(BLUE/GREEN) bolstered many basic concepts.This is a point to realize the complete        integration of the pipeline to run end-to-end.Additionally, learnt about creating cloud instance, deployment methods, API calls, writing build jobs and more.
   

**Deployment**
- Challenges
    - First issue we faced was how to retain the jar and transport the jar from build-server to the two droplets. We achieved this by first sshing into the build-server and then from there scping to the two droplets using the private key available in the shared folder.
    - The description wanted us to create a war through mvn package but there was no way to do it without modifying the code that is present in the repository. This wasn't very convinving to us then. So we went ahead and used the jar that is created. It is run as a background process using nohup and the output is ignored.
   

**Prod up cloud instance**

- Challenges
   - Creating the multiple droplets.The reading of API to understand the creation of two or more droplets simultaneously
   - Getting the IP addresses of the created droplets.Attempted to fetch the information in the create droplet call itself, but not getting IP address field populated instatntly
   - Used a separate function call for getting the droplet information after the droplet creation is completed.
   
   
**Build.yml**
- Challenges
  - When we tried to run the java -jar command with nohup. The process was not being completed and hence wasn't returning control. So we had to make sure the logs and outputs are not displayed and the process runs in the background.
 


  

### Screencast

- [Windows Screencast]()
- [Ubuntu Screencast]()
- [M1 Screencast]()

