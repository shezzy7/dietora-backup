# 🥗 DIETORA Backend — AI-Powered Diet Planning API

> Final Year Project (FYP) — Production-Ready REST API  
> Stack: Node.js · Express.js · MongoDB (Mongoose) · JWT

---

## 📁 Project Structure

```
dietora-backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── profile.controller.js
│   │   ├── mealPlan.controller.js
│   │   ├── grocery.controller.js
│   │   ├── budget.controller.js
│   │   ├── feedback.controller.js
│   │   ├── chatbot.controller.js
│   │   └── admin.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js    # JWT protect + authorize
│   │   ├── error.middleware.js   # Global error handler
│   │   └── validate.middleware.js# Zod validation
│   ├── models/
│   │   ├── User.js
│   │   ├── HealthProfile.js      # 1:1 with User, auto BMI/BMR/TDEE
│   │   ├── FoodItem.js           # Pakistani foods DB
│   │   ├── MealPlan.js           # 7-day AI plan
│   │   ├── GroceryList.js
│   │   ├── Feedback.js
│   │   └── Admin.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── profile.routes.js
│   │   ├── mealPlan.routes.js
│   │   ├── grocery.routes.js
│   │   ├── budget.routes.js
│   │   ├── feedback.routes.js
│   │   ├── chatbot.routes.js
│   │   └── admin.routes.js
│   ├── seeders/
│   │   ├── foodSeeder.js         # 35 Pakistani foods
│   │   └── adminSeeder.js
│   ├── services/
│   │   ├── mealPlanner.service.js# Core AI logic
│   │   ├── grocery.service.js
│   │   └── chatbot.service.js    # Rule-based chatbot
│   ├── utils/
│   │   ├── jwt.utils.js
│   │   └── response.utils.js
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── profile.validator.js
│   │   ├── food.validator.js
│   │   └── feedback.validator.js
│   ├── app.js                    # Express app setup
│   └── server.js                 # Entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Setup & Installation

### 1. Clone & Install

```bash
cd dietora-backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your MongoDB Atlas URI and JWT secret
```

### 3. Seed the Database

```bash
# Seed 35 Pakistani food items
npm run seed

# Create admin account
npm run seed:admin
```

### 4. Start the Server

```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:5000`  
Health check: `http://localhost:5000/health`

---

## 🔐 Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Token is returned on `/auth/register` and `/auth/login`.

---

## 📮 API Endpoints — Postman Collection Notes

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/auth/register` | Public | Register new user |
| POST | `/api/v1/auth/login` | Public | Login & get token |
| GET | `/api/v1/auth/me` | Private | Get current user |
| PUT | `/api/v1/auth/change-password` | Private | Change password |

**Register Body:**
```json
{
  "name": "Ali Hassan",
  "email": "ali@example.com",
  "password": "Password1"
}
```

**Login Body:**
```json
{
  "email": "ali@example.com",
  "password": "Password1"
}
```

---

### Health Profile
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/profile` | Private | Create profile (auto-calculates BMI, BMR, TDEE) |
| GET | `/api/v1/profile` | Private | Get profile |
| GET | `/api/v1/profile/summary` | Private | Get BMI/BMR/TDEE summary |
| PUT | `/api/v1/profile` | Private | Update profile |

**Create Profile Body:**
```json
{
  "age": 25,
  "gender": "male",
  "weight": 75,
  "height": 175,
  "activityLevel": "moderately_active",
  "goal": "weight_loss",
  "isDiabetic": false,
  "isHypertensive": false,
  "isCardiac": false,
  "allergies": [],
  "dailyBudget": 500
}
```

**Activity Levels:** `sedentary` | `lightly_active` | `moderately_active` | `very_active` | `extra_active`  
**Goals:** `weight_loss` | `weight_gain` | `maintenance`

---

### Meal Plans (AI Core)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/meal-plans/generate` | Private | 🤖 Generate AI 7-day plan |
| GET | `/api/v1/meal-plans/active` | Private | Get current active plan |
| GET | `/api/v1/meal-plans` | Private | Get all plans (paginated) |
| GET | `/api/v1/meal-plans/:id` | Private | Get specific plan |
| GET | `/api/v1/meal-plans/:id/day/:dayNumber` | Private | Get single day (1-7) |
| DELETE | `/api/v1/meal-plans/:id` | Private | Archive plan |

**Generate** — no body needed, uses your health profile automatically.

---

### Grocery List
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/grocery-list/generate/:mealPlanId` | Private | Auto-generate from plan |
| GET | `/api/v1/grocery-list` | Private | Get latest grocery list |
| GET | `/api/v1/grocery-list/:id` | Private | Get specific list |
| PATCH | `/api/v1/grocery-list/:id/item/:itemId/toggle` | Private | Toggle item purchased |
| DELETE | `/api/v1/grocery-list/:id` | Private | Delete list |

---

### Budget
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/budget/summary` | Private | Budget analysis |
| POST | `/api/v1/budget/optimize` | Private | Get cheaper alternatives |
| PUT | `/api/v1/budget/update` | Private | Update daily budget |

**Optimize Body:**
```json
{ "targetBudget": 400 }
```

---

### Feedback
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/feedback` | Private | Submit feedback |
| GET | `/api/v1/feedback/my` | Private | Get my feedback |
| GET | `/api/v1/feedback` | Admin | Get all feedback |
| PATCH | `/api/v1/feedback/:id/resolve` | Admin | Resolve feedback |

**Submit Body:**
```json
{
  "type": "meal_plan",
  "rating": 4,
  "comment": "Great plan but biryani is expensive!",
  "tags": ["budget_friendly"]
}
```

---

### Chatbot
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/chatbot` | Private | Send message |

**Body:**
```json
{ "message": "What is BMI?" }
```

---

### Admin
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/admin/foods` | Admin | Add food item |
| GET | `/api/v1/admin/foods` | Admin | List all foods |
| GET | `/api/v1/admin/foods/:id` | Admin | Get food |
| PUT | `/api/v1/admin/foods/:id` | Admin | Update food |
| DELETE | `/api/v1/admin/foods/:id` | Admin | Remove food |
| GET | `/api/v1/admin/users` | Admin | List all users |
| GET | `/api/v1/admin/users/:id` | Admin | Get user details |
| PATCH | `/api/v1/admin/users/:id/toggle` | Admin | Activate/deactivate user |
| GET | `/api/v1/admin/analytics` | Admin | Platform analytics |

---

## 🧮 Formulas Used

### BMI
```
BMI = weight(kg) / height(m)²
```

### BMR — Mifflin-St Jeor (Objective 1.5.1)
```
Male:   BMR = (10 × weight) + (6.25 × height) − (5 × age) + 5
Female: BMR = (10 × weight) + (6.25 × height) − (5 × age) − 161
```

### TDEE
```
TDEE = BMR × Activity Multiplier
  Sedentary:         × 1.2
  Lightly Active:    × 1.375
  Moderately Active: × 1.55
  Very Active:       × 1.725
  Extra Active:      × 1.9
```

### Daily Calorie Target
```
Weight Loss:  TDEE − 500 kcal
Weight Gain:  TDEE + 500 kcal
Maintenance:  TDEE
```

---

## 🤖 AI Planner Pipeline

```
1. fetchConstraints    → Extract calorie target, budget, diseases, allergies
2. filterAllergens     → Remove foods matching user's allergens
3. filterByDiseases    → Apply diabetic/hypertension/cardiac filters
4. groupByMealType     → Group into breakfast/lunch/dinner/snack pools
5. optimizeBudget      → Select cost-effective foods within PKR budget
6. generate7DayPlan    → Pick varied meals for each of 7 days
7. calculateSummaries  → Weekly totals, averages, cost breakdown
```

---

## 🍛 Seeded Pakistani Foods (35 items)

- **Breakfast:** Aloo Paratha, Halwa Puri, Anda Paratha, Khichdi, Anday ka Nashta
- **Bread:** Tandoori Roti, Chapati, Naan
- **Lentils:** Dal Masoor, Dal Mash, Dal Chana, Chana Masala
- **Meat:** Chicken Karahi, Chicken Roast, Beef Qeema, Mutton Karahi, Chicken Tikka
- **Vegetables:** Saag, Bhindi Masala, Karela, Tinda Masala, Palak Paneer, Aloo Gosht
- **Rice:** Chicken Biryani, Matar Pulao, Plain Rice
- **Dairy:** Dahi, Raita, Namkeen Lassi, Meethi Lassi, Doodh Pati Chai
- **Snacks:** Samosa (Baked), Fruit Chaat, Roasted Chana, Seasonal Fruit

All prices reflect **Faisalabad local market rates (PKR)**.

---

## 🛡️ Security Features

- Helmet.js for HTTP header security
- Rate limiting (100 req/15min globally, 20 req/15min on auth)
- JWT authentication with expiry
- Zod input validation on all endpoints
- Password hashing with bcrypt (12 rounds)
- Mongoose sanitization against injection

---

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB Atlas URI | — |
| `JWT_SECRET` | JWT signing secret | — |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `ADMIN_EMAIL` | Default admin email | `admin@dietora.pk` |
| `ADMIN_PASSWORD` | Default admin password | `Admin@12345` |

---

## 👨‍💻 Development Team

**DIETORA** — AI-Powered Personalized Diet Planning System  
Final Year Project · Computer Science Department  
University of Faisalabad
