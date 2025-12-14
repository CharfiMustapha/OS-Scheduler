# Operating System Schedulers

This project is a *process scheduling simulation system* for operating systems. It allows users to visualize and compare the behavior of different scheduling algorithms using configurable process data.

---

## Description

The project consists of a *frontend developed with Next.js* and a *backend implemented in C*. The backend is automatically executed when the frontend is launched. The user can:

* Upload a .txt file containing process definitions.
* Add processes manually.
* Edit or delete existing processes.
* Select one or more scheduling algorithms to execute.
* Visualize the scheduling results directly through the web interface.

---

## Features

### Process Management

* Upload of a process file in TXT format.
* Manual addition of processes through the UI.
* Edit processes loaded from a file or added manually.
* Delete processes before running the simulation.

### Scheduling Algorithms

Users can select one or more of the following scheduling algorithms:
* Selection of scheduling algorithms, including:

  * *FIFO (First In, First Out)*: processes are executed in the order of their arrival.
  * *SJF (Shortest Job First)*: the process with the shortest execution time is executed first.
  * *SRTF (Shortest Remaining Time First)*: the process with the shortest remaining execution time has priority.
  * *Round Robin*: each process is given a fixed time quantum in a cyclic order until completion.
  * *Multi-level with Aging*: processes are distributed across multiple priority levels; their priority increases over time to prevent starvation, and processes with the same priority are scheduled using Round Robin.
  * *Preemptive Priority Scheduling*: the process with the highest priority (lowest numerical value) can interrupt a currently running process.
  * *Non-preemptive Priority Scheduling*: the process with the highest priority (lowest numerical value) waits until the currently running process finishes before being executed.

> *Priority rule:* the smaller the number, the higher the priority.
> Example: P1 has priority 5 and P2 has priority 3 → P2 has higher priority.

---

## TXT File Format

The input file must contain the following fields:

* name: process name
* arrival: arrival time
* burst: execution time
* priority: process priority (lower number = higher priority)

---

## Technologies

* *Frontend*: Next.js
* *Backend*: C

---

## Installation and Execution

### Install Node.js and Next.js

1. Install Node.js (recommended version ≥ 18):

   ```bash
   sudo apt update
   sudo apt install nodejs npm
   
2. Verify the installation:

   ```bash
   node -v
   npm -v
   
3. Install frontend dependencies:

   ```bash
   cd Full_App
   npm install
   

---

### Run the Project

1. Start the frontend (the C backend will start automatically):

   ```bash
   npm run dev
   
2. Open your browser and navigate to:

   
   http://localhost:3000
   

---

## Usage

1. Upload a file or add processes manually.
2. Edit or delete processes as needed.
3. Select the desired scheduling algorithms.
4. Run the simulation.
5. View the scheduling results and the corresponding Gantt chart.

---