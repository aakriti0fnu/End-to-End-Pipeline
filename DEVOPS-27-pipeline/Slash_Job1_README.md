
# Welcome to Pipeline Job1 - Slash

<img src = Screenshots/slash.png width = 500 height = 250>

Slash is a web application that scrapes the most popular e-commerce websites to get the best deals on the searched items across these websites.
## Github Repo

https://github.com/SE21-Team2/slash.git


## Technology Stack
<table bordercolorlight="#b9dcff" bordercolordark="#006fdd">

  <tr style="background: #010203 ">
    <td valign="left"> 
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width = 50>

  </td>
    <td><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" width = 50>
  </td>
  <td><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg" width = 50>     
  </td>

<td><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" width = 50>
 
  </td>
    </tr>
    </table>



     



- Backend - Python, Flask
- Frontend - Javascript,React

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
    - Use two terminals for Build jobs 
       - For backend - Run
          - `node index.js build slash-build build.yml`
          - Note: Once it is completed and backend server starts, go to next terminal and run the another job
      - For Frontend - Run
          - `node index.js build slash-frontend build.yml`
    - Open browser and enter `http://192.168.56.10:3000` (once the build is completed and service is started)

## Build Job Specification

- This web service has 2 build jobs: For frontend and For backend 

- The buid job `slash-build` contains instruction for the following:
   - Installing the dependencies required for slash
      - Python,pip, Nodejs, npm
   - Cloning the repo - [Slash](https://github.com/SE21-Team2/slash.git)
   - Installing the requirements
   - Running pytest
   - Running backened python server

- The buid job `slash-frontend` contains instruction for the following:
   - installing npm packages
   - running the frontend server hosting the web app
   - hosting slash on VM's IP 
   `http://192.168.56.10:3000`


## Test

- The slash test suits are used for testing the job.
  `pytest` is running the slash tests (taking the existing test suite from the repo)

**Note** The failing tests and code coverage is a part of existing repo, as i am not responsible for changing the code, therefore running the existing tests as it is to demonstrate the `Test` stage of the pipeline

## Deployment

This is the basic deployment without any specific/underlined strategy or technique.
The Deployment is done by hosting the service `slash` on VM's IP, so after build is successful, the website is accessible on `http://192.168.56.10:3000`

## Challenges

- The major challenge was finding a web service with test suites.
- Secondly, understanding the dependencies and required installations
- Ubuntu system had the problem with hosting on VM's IP because of interface issue, therefore net tools is installed and interface details are added to the VM on initializing that resolved the issue


## Screencast

[Slash](https://drive.google.com/file/d/12Hm58szwfkP8zJCsmC_cQUr1kCdNQuEZ/view)