# Project description
This project is created for our masters course "Computer networks and distibuted systems" at ELTE, this is a Student Project, that is an implementation of the following paper: [Time, Travel, and Energy in the Uniform Dispersion Problem by Michael Amir, Alfred M. Bruckstein](https://arxiv.org/pdf/2404.19564)

# Uniform Dispersion Problem

This project simulates the uniform dispersion of robots in a grid field. The robots navigate through the field, avoiding obstacles and ensuring even distribution.

## Table of Contents

- [Uniform Dispersion Problem](#uniform-dispersion-problem)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Installation](#installation)
    - [Or run the project locally:](#or-run-the-project-locally)
  - [Usage](#usage)
    - [Create Custom Fields](#create-custom-fields)
  - [Project Structure](#project-structure)

## Introduction

The Uniform Dispersion Problem involves distributing robots uniformly across a field while avoiding obstacles. This project provides a visual simulation of this problem, allowing users to load different field configurations and observe the robots' behavior.

> [!NOTE]
> This algorithm only works on "simply connected environments" that is an environment where the free cells form a connected graph, and the complementer of the free cells also form a connected graph.

## Installation

Check out the hosted version of the project [here](https://kristofy.github.io/uniform-dispersion-problem/).

### Or run the project locally:

1. Clone the repository:

   ```sh
   $ git clone https://github.com/Kristofy/uniform-dispersion-problem.git
   $ cd uniform-dispersion-problem
   ```

2. Start a webserver in the `src` directory

   ```sh
   $ cd src
   $ python3 -m http.server
   ```

3. Open the hosted version in a browser.

## Usage

1. **Load a Field Configuration:**

   - Click the "Load Level" button to select a field configuration from the `./palyak` directory.

2. **Start/Pause the Simulation:**

   - Use the "Start/Pause" button to control the simulation.

3. **Adjust Simulation Speed:**

   - Use the speed slider to change the simulation speed.

4. **Toggle Asynchronous Mode:**

   - Use the async switch to toggle between synchronous and asynchronous robot movements.

5. **Inspect Field Cells:**
   - Click on cells in the field to view their details.

### Create Custom Fields

Create a pixel image with the following colors to define a custom field configuration:

- **White**: Empty cell
- **Black**: Wall
- **Red**: Robot spawn point

Put your custom field image in the `./palyak` directory, add it to the `palyak/levels.json` and after reloading the webserver load it using the "Load Level" button.

Every pixel will be snapped to the nearest valid cell color

## Project Structure

```plaintext
src/algorithms.js: Contains the algorithms for robot movement.
src/app.js: Main application logic and event handling.
src/cell.js: Defines different types of cells in the field.
src/field.js: Manages the field and its cells.
src/image.js: Handles image processing for field configurations.
src/index.html: Main HTML file for the project.
src/palyak/: Directory containing field configuration images.
src/settings.js: Manages simulation settings.
src/vector.js: Defines vector operations used in the project.
```

Every js file is an ES6 module and everything is typed with JSDoc

