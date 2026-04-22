# DIETORA — SRS Traceability Matrix

This document maps each SRS requirement to the implemented feature in the codebase.

---

## 1. Functional Requirements Traceability

### FR-1: User Authentication
| SRS Requirement | Implementation | Files |
|-----------------|---------------|-------|
| FR-1.1 User Registration | POST /api/v1/auth/register with Zod validation | `auth.controller.js`, `RegisterPage.jsx` |
| FR-1.2 User Login | POST /api/v1/auth/login + JWT token | `auth.controller.js`, `LoginPage.jsx` |
| FR-1.3 Session Persistence | JWT stored in localStorage, attached via Axios interceptor | `api.js`, `authSlice.js` |
| FR-1.4 Protected Routes | ProtectedRoute component + JWT middleware | `App.jsx`, `auth.middleware.js` |
| FR-1.5 Logout | Clear token from localStorage + Redux state reset | `authSlice.js`, `Sidebar.jsx` |

### FR-2: Health Profile Management
| SRS Requirement | Implementation | Files |
|-----------------|---------------|-------|
| FR-2.1 Profile Creation | POST /api/v1/profile | `profile.controller.js`, `HealthProfilePage.jsx` |
| FR-2.2 Profile Update | PUT /api/v1/profile | `profile.controller.js`, `profileSlice.js` |
| FR-2.3 BMI Calculation | Auto-calc in HealthProfile pre-save hook: weight/height² | `HealthProfile.js` |
| FR-2.4 BMR (Mifflin-St Jeor) | Male: 10W+6.25H-5A+5, Female: 10W+6.25H-5A-161 | `HealthProfile.js` |
| FR-2.5 TDEE Calculation | BMR × activity multiplier (1.2 to 1.9) | `HealthProfile.js` |
| FR-2.6 Disease Selection | isDiabetic, isHypertensive, isCardiac boolean flags | `HealthProfile.js`, `HealthProfilePage.jsx` |
| FR-2.7 Allergy Selection | allergies[] array with 6 options | `HealthProfile.js`, `HealthProfilePage.jsx` |
| FR-2.8 Budget Setting | dailyBudget field in PKR, min ₨100 | `HealthProfile.js`, `HealthProfilePage.jsx` |

### FR-3: AI Meal Plan Generation
| SRS Requirement | Implementation | Files |
|-----------------|---------------|-------|
| FR-3.1 7-Day Plan Generation | POST /api/v1/meal-plans/generate | `mealPlan.controller.js` |
| FR-3.2 Disease-Safe Filtering | filterByDiseases() checks is_diabetic_safe, etc. | `mealPlanner.service.js` |
| FR-3.3 Allergen Exclusion | filterAllergens() matches food allergens vs profile | `mealPlanner.service.js` |
| FR-3.4 Budget Optimization | optimizeBudget() greedy algorithm by calorie/PKR ratio | `mealPlanner.service.js` |
| FR-3.5 Calorie Targeting | TDEE-based daily targets per profile goal | `mealPlanner.service.js` |
| FR-3.6 Meal Type Coverage | breakfast, lunch, dinner, snack per day | `mealPlanner.service.js` |
| FR-3.7 Food Variety | Set-based variety tracking (usedIds) across 7 days | `mealPlanner.service.js` |
| FR-3.8 Pakistani Foods | 35+ local foods with Faisalabad PKR prices | `foodSeeder.js` |
| FR-3.9 Plan Archival | Previous active plans archived on new generation | `mealPlan.controller.js` |

### FR-4: Grocery List
| SRS Requirement | Implementation | Files |
|-----------------|---------------|-------|
| FR-4.1 Auto-Generate from Plan | POST /api/v1/grocery-list/generate/:id aggregates all food items | `grocery.service.js` |
| FR-4.2 Item Grouping by Category | itemMap groups by category | `grocery.service.js`, `GroceryListPage.jsx` |
| FR-4.3 Mark as Purchased | PATCH /api/v1/grocery-list/:id/item/:itemId/toggle | `grocery.controller.js` |
| FR-4.4 Total Cost Display | totalEstimatedCost summed from all items | `grocery.service.js` |
| FR-4.5 Shopping Progress | checkedCount/totalItems progress bar | `GroceryListPage.jsx` |

### FR-5: Budget Optimization
| SRS Requirement | Implementation | Files |
|-----------------|---------------|-------|
| FR-5.1 Budget vs Plan Analysis | GET /api/v1/budget/summary | `budget.controller.js` |
| FR-5.2 Alternative Suggestions | POST /api/v1/budget/optimize returns cheaper foods | `budget.controller.js` |
| FR-5.3 Budget Update | PUT /api/v1/budget/update | `budget.controller.js` |
| FR-5.4 Adherence Percentage | budgetUsed/weeklyBudget × 100 | `budget.controller.js`, `BudgetPage.jsx` |

### FR-6: Progress Tracking
| SRS Requirement | Implementation | Files |
|-----------------|---------------|-------|
| FR-6.1 Calorie Chart | Recharts AreaChart — daily calories vs TDEE target | `ProgressPage.jsx` |
| FR-6.2 Budget Chart | Recharts BarChart — daily spend vs budget | `ProgressPage.jsx` |
| FR-6.3 Macros Breakdown | Recharts PieChart — protein/carbs/fat distribution | `ProgressPage.jsx` |
| FR-6.4 Adherence by Day | Progress bars per weekday | `ProgressPage.jsx` |

### FR-7: Educational Hub
| SRS Requirement | Implementation | Files |
|-----------------|---------------|-------|
| FR-7.1 6 Health Articles | Diabetes, Hypertension, Cardiac, BMR/TDEE, Protein, Weight | `EducationalHubPage.jsx` |
| FR-7.2 Article Reading View | Full expandable article with sections | `EducationalHubPage.jsx` |
| FR-7.3 Search/Filter | Category filter + text search | `EducationalHubPage.jsx` |

### FR-8: AI Chatbot
| SRS Requirement | Implementation | Files |
|-----------------|---------------|-------|
| FR-8.1 Floating Widget | Fixed-position chatbot button + window | `ChatbotWidget.jsx` |
| FR-8.2 Rule-Based Responses | Keyword intent detection with 15+ intents | `chatbot.service.js`, `chatbotSlice.js` |
| FR-8.3 Quick Suggestions | Suggested question chips | `ChatbotWidget.jsx` |
| FR-8.4 Chat History | Redux-persisted messages array | `chatbotSlice.js` |
| FR-8.5 Clear Chat | clearChat() action resets messages | `chatbotSlice.js` |

### FR-9: Admin Panel
| SRS Requirement | Implementation | Files |
|-----------------|---------------|-------|
| FR-9.1 Food Item CRUD | Full create/read/update/delete for FoodItem | `admin.controller.js`, `AdminPage.jsx` |
| FR-9.2 User Management | List all users + activate/deactivate | `admin.controller.js`, `AdminPage.jsx` |
| FR-9.3 Admin-Only Access | authorize('admin') middleware on all admin routes | `admin.routes.js`, `auth.middleware.js` |
| FR-9.4 Platform Analytics | GET /api/v1/admin/analytics | `admin.controller.js` |

---

## 2. Non-Functional Requirements Traceability

| NFR | Requirement | Implementation |
|-----|-------------|----------------|
| NFR-1 | Performance: meal generation < 2 sec | Greedy algorithm (no ML), MongoDB indexed queries, no external API calls |
| NFR-2 | Security: JWT authentication | `auth.middleware.js`, bcrypt password hashing |
| NFR-3 | Security: Rate limiting | express-rate-limit: 100 req/15min, 20 auth req/15min |
| NFR-4 | Security: Input validation | Zod schemas on all POST/PUT routes |
| NFR-5 | Usability: Responsive design | Tailwind CSS responsive grid, tested mobile/tablet/desktop |
| NFR-6 | Usability: Dark mode | CSS class-based dark mode, themeSlice persists to localStorage |
| NFR-7 | Usability: Toast notifications | react-hot-toast on all actions |
| NFR-8 | Reliability: Error handling | Global error middleware, frontend Axios interceptors |
| NFR-9 | Maintainability: Modular architecture | Separate controllers/services/models/routes layers |
| NFR-10 | Localization: PKR currency | All prices in Pakistani Rupees ₨ |

---

## 3. Data Flow Diagrams (DFD) Implementation

### Level 0 — Context Diagram
```
[User] ──────→ [DIETORA System] ──────→ [MongoDB Database]
                     ↑
              [Admin User]
```

### Level 1 — Main Processes
```
[User Input] → [1.0 Auth Module] → JWT Token
[Health Data] → [2.0 Profile Module] → BMI/BMR/TDEE
[Profile] → [3.0 AI Meal Planner] → 7-Day Plan
[Meal Plan] → [4.0 Grocery Generator] → Shopping List
[Meal Plan] → [5.0 Budget Optimizer] → Savings Report
[All Data] → [6.0 Progress Tracker] → Charts
[Query] → [7.0 Chatbot] → Nutrition Answer
```

---

## 4. Entity Relationship Diagram (ERD)

```
User (1) ──────── (1) HealthProfile
User (1) ──────── (N) MealPlan
User (1) ──────── (N) GroceryList
User (1) ──────── (N) Feedback
User (1) ──────── (1) Admin [if role=admin]
MealPlan (1) ───── (N) Day [7 days embedded]
Day (1) ────────── (N) MealSlot [embedded]
MealSlot (N) ────── (1) FoodItem
GroceryList (N) ─── (1) MealPlan
GroceryList (1) ─── (N) GroceryItem [embedded]
```

---

## 5. Use Case Mapping

| Use Case | Actor | Implementation |
|----------|-------|----------------|
| UC-01: Register | Guest | RegisterPage → POST /auth/register |
| UC-02: Login | Registered User | LoginPage → POST /auth/login |
| UC-03: Setup Health Profile | User | HealthProfilePage → POST/PUT /profile |
| UC-04: Generate Meal Plan | User | MealPlanPage → POST /meal-plans/generate |
| UC-05: View Meal Plan | User | MealPlanPage → GET /meal-plans/active |
| UC-06: View Grocery List | User | GroceryListPage → GET/POST /grocery-list |
| UC-07: Mark Item Purchased | User | GroceryListPage → PATCH /grocery-list/:id/item/:itemId/toggle |
| UC-08: Optimize Budget | User | BudgetPage → POST /budget/optimize |
| UC-09: Track Progress | User | ProgressPage → Recharts visualizations |
| UC-10: Read Education Article | User | EducationalHubPage → Static content |
| UC-11: Ask Chatbot | User | ChatbotWidget → POST /chatbot or local Redux |
| UC-12: Submit Feedback | User | FeedbackPage → POST /feedback |
| UC-13: Manage Foods (CRUD) | Admin | AdminPage → /admin/foods |
| UC-14: Manage Users | Admin | AdminPage → /admin/users |
| UC-15: View Analytics | Admin | AdminPage → GET /admin/analytics |
