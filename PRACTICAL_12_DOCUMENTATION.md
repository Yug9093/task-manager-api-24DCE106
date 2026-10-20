# Practical 12: CI/CD Pipeline with GitHub Actions

**Course Outcome / Program Outcome:** CO1, CO4 / PO3, PO5  
**Objective:** To configure an automated Continuous Integration (CI) pipeline using GitHub Actions that triggers on every push to the `main` branch, installs dependencies, executes automated API tests using Jest and Supertest, and demonstrates both pipeline failure and successful recovery.

---

## 📌 1. Aim & Objectives

To design, configure, and evaluate an automated **Continuous Integration (CI) pipeline** for the full-stack Task Management application using **GitHub Actions**. The pipeline automatically validates code commits, provisions a dedicated Node.js runtime and MongoDB service container on an Ubuntu runner, installs dependencies via `npm install`, executes automated endpoint tests, and enforces quality gates by reporting build status badges (pass/fail).

### Key Objectives:
1. **Testing Infrastructure Setup**: Install and configure `jest` and `supertest` as development dependencies in the backend.
2. **Automated Endpoint Testing**: Write automated integration tests covering the root API documentation endpoint (`GET /`) and the task retrieval endpoint (`GET /tasks`).
3. **Workflow Declaration (`.github/workflows/ci.yml`)**: Define a declarative GitHub Actions workflow triggered on `push` and `pull_request` events targeting `main`.
4. **Service Container Orchestration**: Spin up an ephemeral `mongo:latest` service container inside the GitHub Actions runner to support integration tests.
5. **Simulated CI Pipeline Failure**: Deliberately introduce an assertion error in the test suite to demonstrate build failure detection (Red X / `failure` conclusion).
6. **Pipeline Restoration**: Correct the assertion error, push to GitHub, and confirm automated recovery to a green passing state (Green Checkmark / `success` conclusion).

---

## 🏗️ 2. Architectural Overview & CI Pipeline Flow

### GitHub Actions CI Execution Pipeline:

```text
=============================================================================
GITHUB ACTIONS CONTINUOUS INTEGRATION (CI) ARCHITECTURE
=============================================================================

Developer Workspace
       │
       ▼ [git push origin main]
GitHub Repository (Yug9093/task-manager-api-24DCE106)
       │
       ▼ Triggers Event: push -> branches: [main]
GitHub Actions Orchestrator
       │
       ▼ Provisions Ephemeral Runner: ubuntu-latest
┌───────────────────────────────────────────────────────────────────────────┐
│ GitHub Actions Runner (ubuntu-latest)                                     │
│                                                                           │
│   ┌───────────────────────────────────────────────────────────────────┐   │
│   │ Docker Service Container: mongodb (mongo:latest on port 27017)    │   │
│   └─────────────────────────────────┬─────────────────────────────────┘   │
│                                     │ Host Network / Port 27017           │
│   ┌─────────────────────────────────▼─────────────────────────────────┐   │
│   │ Job: build-and-test                                               │   │
│   │                                                                   │   │
│   │  Step 1: actions/checkout@v4                                      │   │
│   │          Downloads repository source code                         │   │
│   │                                                                   │   │
│   │  Step 2: actions/setup-node@v4 (Node.js 20 LTS)                   │   │
│   │          Sets up Node environment and npm CLI                     │   │
│   │                                                                   │   │
│   │  Step 3: npm install (working-directory: ./task-manager-api)      │   │
│   │          Installs production & development dependencies           │   │
│   │                                                                   │   │
│   │  Step 4: npm test (Jest + Supertest)                              │   │
│   │          Executes tests/app.test.js                               │   │
│   │          Connects to MongoDB service container                    │   │
│   └─────────────────────────────────┬─────────────────────────────────┘   │
└─────────────────────────────────────┼─────────────────────────────────────┘
                                      │
               ┌──────────────────────┴──────────────────────┐
               ▼                                             ▼
        [Tests Passed]                                [Test Assertion Error]
       Outcome: SUCCESS                              Outcome: FAILURE
       Badge: Green Checkmark                         Badge: Red X
```

---

## 🛠️ 3. Step-by-Step Implementation

### Step 1: Install Testing Libraries
Installed `jest` and `supertest` as development dependencies in `task-manager-api`:

```bash
cd task-manager-api
npm install --save-dev jest supertest
```

Configured the `test` script in [`task-manager-api/package.json`](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/task-manager-api/package.json):

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js",
    "test": "jest --detectOpenHandles --forceExit --runInBand"
  },
  "devDependencies": {
    "jest": "^30.5.2",
    "supertest": "^7.3.1"
  }
}
```

---

### Step 2: Write Automated Integration Tests
Created [`task-manager-api/tests/app.test.js`](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/task-manager-api/tests/app.test.js) to test API endpoints via Supertest:

```javascript
const request = require('supertest');
const app = require('../index');
const mongoose = require('mongoose');

describe('Task Management API Tests (CI Pipeline)', () => {
  afterAll(async () => {
    // Close mongoose connection after tests complete to ensure clean exit
    try {
      await mongoose.connection.close();
    } catch (err) {
      // ignore
    }
  });

  // Test 1: Verify root API documentation endpoint
  test('GET / returns 200 and welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('Welcome to the Task Management RESTful API');
  });

  // Test 2: Verify GET /tasks endpoint returns status 200 (Practical 12 requirement)
  test('GET /tasks returns 200', async () => {
    const res = await request(app).get('/tasks');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
```

---

### Step 3: Create GitHub Actions Workflow (`.github/workflows/ci.yml`)
Created [`.github/workflows/ci.yml`](file:///c:/Users/yugpa/OneDrive/Documents/GitHub/task-manager-api-24DCE106/.github/workflows/ci.yml) defining the automated pipeline:

```yaml
name: CI Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    name: Build & Run Automated Tests
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017

    defaults:
      run:
        working-directory: ./task-manager-api

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Setup Node.js 20 Environment
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Dependencies
        run: npm install

      - name: Run Automated Tests (Jest & Supertest)
        env:
          MONGO_URI: mongodb://127.0.0.1:27017/taskDB_test
          JWT_SECRET: ci_secret_key_taskflow_test
          NODE_ENV: test
        run: npm test
```

---

## 📊 4. Measured Experimental Evidence: Passed vs. Failed Pipeline Runs

The pipeline was executed across three commits on GitHub, demonstrating initial success, failure on broken test, and restoration on fix.

### GitHub Actions Pipeline Execution Summary:

| Run Number | Commit SHA | Commit Message | Result | Conclusion | GitHub Run Link |
| :---: | :---: | :--- | :---: | :---: | :--- |
| **Run 1** | `62229a2` | `ci: set up GitHub Actions CI workflow with Jest and Supertest` | **PASS** | `success` (Green) | [Run 39438467049](https://github.com/Yug9093/task-manager-api-24DCE106/actions/runs/39438467049) |
| **Run 2** | `4e2a508` | `test: deliberately break GET /tasks assertion to demonstrate CI pipeline failure` | **FAIL** | `failure` (Red X) | [Run 39438754081](https://github.com/Yug9093/task-manager-api-24DCE106/actions/runs/39438754081) |
| **Run 3** | `58fbdbb` | `test: fix GET /tasks test assertion to restore green CI pipeline status` | **PASS** | `success` (Green) | [Run 39439113647](https://github.com/Yug9093/task-manager-api-24DCE106/actions/runs/39439113647) |

---

### Step 5 Evidence: Deliberately Broken Test (Red X / Failed Pipeline)

#### Code Change:
```javascript
test('GET /tasks returns 200', async () => {
  const res = await request(app).get('/tasks');
  // Deliberately broken: expecting 999 instead of 200
  expect(res.statusCode).toBe(999);
});
```

#### GitHub Actions Runner Error Log:
```text
FAIL tests/app.test.js
  Task Management API Tests (CI Pipeline)
    √ GET / returns 200 and welcome message (54 ms)
    ✕ GET /tasks returns 200 (68 ms)

  ● Task Management API Tests (CI Pipeline) › GET /tasks returns 200

    expect(received).toBe(expected) // Object.is equality

    Expected: 999
    Received: 200

      23 |     const res = await request(app).get('/tasks');
      24 |     // Deliberately broken assertion to trigger CI pipeline failure (Red X)
    > 25 |     expect(res.statusCode).toBe(999);
         |                            ^
      26 |   });

Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 passed, 2 total
Snapshots:   0 total
Time:        1.452 s
Error: Process completed with exit code 1.
```

**Observation:** GitHub Actions flagged the step `Run Automated Tests (Jest & Supertest)` with a **Red X**, blocked the job, and marked the commit as failed.

---

### Step 6 Evidence: Restored & Passing Pipeline (Green Checkmark)

#### Code Change:
```javascript
test('GET /tasks returns 200', async () => {
  const res = await request(app).get('/tasks');
  expect(res.statusCode).toBe(200);
  expect(res.body.success).toBe(true);
});
```

#### GitHub Actions Runner Success Log:
```text
PASS tests/app.test.js
  Task Management API Tests (CI Pipeline)
    √ GET / returns 200 and welcome message (64 ms)
    √ GET /tasks returns 200 (59 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        1.591 s
Ran all test suites.
```

**Observation:** All steps completed successfully in **28 seconds**, resulting in a **Green Checkmark** on GitHub.

---

## 📸 5. Lab Journal Verification & Screenshot Guide

To document this practical in the lab journal:
1. Navigate to your GitHub repository:
   **`https://github.com/Yug9093/task-manager-api-24DCE106/actions`**
2. **Screenshot 1 (Failed Run)**:
   - Click on the run titled: `test: deliberately break GET /tasks assertion to demonstrate CI pipeline failure`.
   - Take a screenshot showing the **Red X** next to `build-and-test` and the failed `npm test` step with `Expected: 999, Received: 200`.
3. **Screenshot 2 (Fixed Run)**:
   - Click on the run titled: `test: fix GET /tasks test assertion to restore green CI pipeline status`.
   - Take a screenshot showing the **Green Checkmark** next to `build-and-test` with all steps passing.
4. **Screenshot 3 (Workflow History)**:
   - View the overall **Actions** tab showing the chronological progression:
     - `success` (Run #3) ──► `failure` (Run #2) ──► `success` (Run #1).

---

## 🎯 6. Key Learnings & Takeaways

1. **Shift-Left Quality Assurance**:
   - Continuous Integration catches regression bugs immediately upon commit, preventing broken code from advancing to staging or production.
2. **Deterministic Environments**:
   - Running tests in clean, isolated runners with dedicated Docker service containers guarantees that test results are independent of individual developer machine setups.
3. **Fast Feedback Loops**:
   - Automated test execution in under 30 seconds enables developers to push code with confidence and address regressions in real time.
