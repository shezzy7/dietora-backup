# DIETORA — API Reference

Base URL (Development): `http://localhost:5000/api/v1`
Authentication: `Authorization: Bearer <JWT_TOKEN>`

---

## Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login and get JWT |
| GET | `/auth/me` | ✅ | Get current user |
| PUT | `/auth/change-password` | ✅ | Change password |

### POST /auth/register
```json
// Request Body
{
  "name": "Ali Hassan",
  "email": "ali@example.com",
  "password": "Ali@12345"
}
// Response 201
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1...",
  "user": { "id": "...", "name": "Ali Hassan", "email": "...", "role": "user" }
}
```

### POST /auth/login
```json
// Request Body
{ "email": "ali@example.com", "password": "Ali@12345" }
// Response 200 — same shape as register
```

---

## Health Profile Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/profile` | ✅ | Create health profile (first time) |
| GET | `/profile` | ✅ | Get own health profile |
| PUT | `/profile` | ✅ | Update health profile |
| GET | `/profile/summary` | ✅ | Get BMI/BMR/TDEE summary |

### POST/PUT /profile
```json
// Request Body
{
  "age": 28,
  "gender": "male",
  "weight": 72,
  "height": 175,
  "activityLevel": "moderately_active",
  "goal": "weight_loss",
  "isDiabetic": false,
  "isHypertensive": true,
  "isCardiac": false,
  "allergies": ["dairy"],
  "dailyBudget": 500
}
// Response — includes auto-calculated: bmi, bmr, tdee, dailyCalorieTarget
```

---

## Meal Plan Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/meal-plans/generate` | ✅ | Generate 7-day AI meal plan |
| GET | `/meal-plans` | ✅ | Get all plans (paginated) |
| GET | `/meal-plans/active` | ✅ | Get current active plan |
| GET | `/meal-plans/:id` | ✅ | Get specific plan by ID |
| GET | `/meal-plans/:id/day/:dayNumber` | ✅ | Get single day from plan |
| DELETE | `/meal-plans/:id` | ✅ | Archive a meal plan |

### POST /meal-plans/generate
```json
// Request Body (all optional — uses profile defaults)
{ "budgetLimit": 400 }
// Response 201
{
  "success": true,
  "data": {
    "_id": "...",
    "days": [
      {
        "day": 1,
        "dayName": "Monday",
        "breakfast": [{ "foodItem": {...}, "calories": 320, "price": 50 }],
        "lunch": [...],
        "dinner": [...],
        "snack": [...],
        "totalCalories": 1850,
        "totalCost": 380
      }
    ],
    "weeklyTotalCalories": 12950,
    "weeklyTotalCost": 2660
  }
}
```

---

## Grocery List Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/grocery-list` | ✅ | Get latest grocery list |
| POST | `/grocery-list/generate/:mealPlanId` | ✅ | Generate list from meal plan |
| GET | `/grocery-list/:id` | ✅ | Get specific list |
| PATCH | `/grocery-list/:id/item/:itemId/toggle` | ✅ | Toggle item purchased |
| DELETE | `/grocery-list/:id` | ✅ | Delete list |

---

## Budget Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/budget/summary` | ✅ | Budget analysis for active plan |
| POST | `/budget/optimize` | ✅ | Get cheaper food suggestions |
| PUT | `/budget/update` | ✅ | Update daily budget |

### POST /budget/optimize
```json
// Request
{ "targetBudget": 350 }
// Response
{
  "data": {
    "targetBudget": 350,
    "estimatedDailyCost": 280,
    "suggestions": {
      "breakfast": [...foods under budget...],
      "lunch": [...],
      "dinner": [...],
      "snack": [...]
    },
    "tip": "Regenerate your meal plan with updated budget to apply these suggestions."
  }
}
```

---

## Feedback Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/feedback` | ✅ | Submit feedback |
| GET | `/feedback/my` | ✅ | Get own feedback history |
| GET | `/feedback` | ✅ Admin | Get all feedback |
| PATCH | `/feedback/:id/resolve` | ✅ Admin | Resolve feedback |

### POST /feedback
```json
{ "rating": 5, "type": "general", "comment": "Great app!", "tags": [] }
```

---

## Admin Endpoints (role: admin required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/analytics` | Platform stats |
| GET | `/admin/foods` | All food items |
| POST | `/admin/foods` | Create food item |
| PUT | `/admin/foods/:id` | Update food item |
| DELETE | `/admin/foods/:id` | Remove food item |
| GET | `/admin/users` | All users |
| PATCH | `/admin/users/:id/toggle` | Activate/deactivate user |

---

## Chatbot Endpoint

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/chatbot` | ✅ | Send message, get nutrition response |

```json
// Request
{ "message": "What foods are safe for diabetics?" }
// Response
{
  "data": {
    "intent": "diabetes",
    "reply": "DIETORA filters food items that are safe for diabetics...",
    "suggestions": ["What foods are diabetic safe?", "Generate diabetic meal plan"]
  }
}
```

---

## Error Response Format

All errors follow this format:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [{ "field": "email", "message": "Invalid email address" }]
}
```

### HTTP Status Codes Used
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (no/invalid token) |
| 403 | Forbidden (wrong role) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
