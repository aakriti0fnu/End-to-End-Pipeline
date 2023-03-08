# Welcome to Pipeline Job2 - Pencilblue

<img src = Screenshots/pencilblue.png width = 400 height = 250>

It is a a full featured Node.js CMS and blogging platform (plugins, server cluster management, data-driven pages)
It is a open source project and have 

## Github Repo

https://github.com/pencilblue/pencilblue.git


## Technology Stack
<table bordercolorlight="#b9dcff" bordercolordark="#006fdd">

  <tr style="background: #010203 ">
    <td valign="left"> 
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width = "40" height = "40" />

  </td>
    <td><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" width = "40"height = "40" />
  </td>
  <td><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" width = "40" height = "40" />
  </td>

<td><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" width = "40" height = "40" />

    
  </td>
    </tr>
    </table>


- Backend - Node.js
- Frontend - Javascript, HTML, CSS

## How to run

- git clone the repo - https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-27.git
- Create a build.yml file in the root directory of the project or rename the build.yml.template to build.yml
    - Refer to the [template](https://github.ncsu.edu/CSC-DevOps-S22/DEVOPS-27/blob/F0-aaakrit/build.yml.template)
- Create a file named ".env" (please don't add a filename, it's just .env) in the root directory of the project.
This file should contain the (your)github access token in the same format 
  - `ACCESS_TOKEN="xxxxxxxxx"`
- Run the follwing commands:
    - `npm install`
    - `node index.js init`
    - `node index.js build pencilblue-build build.yml`
    - Open browser and enter `http://192.168.56.10:8080` (once the build is completed and service is started with a message - `[nodemon] starting node   pencilblue.js`)

## Build Job Specification

- The buid job `pencilblue-build` contains instruction for the following:
   - Installing the dependencies required for pencilblue
      - Nodejs, npm, Mongodb ,nodemon
   - Cloning the repo - [Pencilblue](https://github.com/pencilblue/pencilblue.git)
   - Starting the db server
   - running npm install 
   - running npm test
   - running the service
   - hosting it on VM's IP

## Test

- The pencilblue test suits are used for testing the job.
  `npm test` is running the pencilblue tests

**Note** The failing tests and code coverage is a part of existing repo, as i am not responsible for changing the code, therefore running the existing tests as it is to demonstrate the `Test` stage of the pipeline

## Deployment

This is the basic deployment without any specific/underlined strategy or technique.
The Deployment is done by hosting the service on VM's IP, so after build is successful, the website is accessible on `http://192.168.56.10:8080`

## Challenges

- The major challenge was finding a web service with test suites.
- Secondly, understanding the dependencies and required installations
- Deploying service on VM's IP. This website pops a message if hosting it on an IP not specified in the config.js under site-root,therefore changing the config.js to add the VM's IP to be able to deploy it successfully from VM on the browser running in the local system

## Screencast

[Pencilblue](https://youtu.be/ZH00c734xcQ)





