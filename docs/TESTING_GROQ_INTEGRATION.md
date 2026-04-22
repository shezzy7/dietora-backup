// tests/groq-integration.test.md
# 🧪 Groq Integration Testing Guide

## Pre-requisites

- ✅ Node.js 18+
- ✅ MongoDB running (local or Atlas)
- ✅ GROQ_API_KEY set in `.env`
- ✅ Backend dependencies installed (`npm install`)

---

## 1️⃣ Setup Test Environment

```bash
cd dietora-backend

# Option A: Use existing MongoDB
cp .env.example .env
# Edit .env with your GROQ_API_KEY and MONGODB_URI

# Option B: Local MongoDB
mongod  # In another terminal

# Install dependencies
npm install

# Seed sample data
npm run seed
npm run seed:admin

# Start server
npm run dev
```

Check console output:
```
✅ MongoDB Connected: localhost:27017
🚀 DIETORA Backend running on port 5000
🤖 Groq API initialized
```

---

## 2️⃣ Manual Testing (cURL)

### Test 1: Get Health Check

```bash
curl -X GET http://localhost:5000/health \
  -H "Content-Type: application/json"

# Expected Response:
{
  "success": true,
  "message": "DIETORA API is running 🥗",
  "timestamp": "2026-04-22T...",
  "version": "1.0.0"
}
```

### Test 2: Register & Login

```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123"
  }'

# Copy the JWT token from response
# Expected:
{
  "success": true,
  "token": "eyJhbGci...",
  "user": { "id": "...", "name": "Test User", ... }
}

# Save TOKEN for next requests
TOKEN="eyJhbGci..."
```

### Test 3: Create Health Profile

```bash
curl -X POST http://localhost:5000/api/v1/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "age": 28,
    "gender": "male",
    "height": 175,
    "weight": 75,
    "activityLevel": "moderately_active",
    "goal": "weight_loss",
    "isDiabetic": false,
    "isHypertensive": false,
    "isCardiac": false,
    "allergies": [],
    "dailyBudget": 500
  }'

# Expected:
{
  "success": true,
  "data": {
    "bmi": 24.5,
    "bmiCategory": "Healthy",
    "bmr": 1700,
    "tdee": 2635,
    "dailyCalorieTarget": 2135
  }
}
```

### Test 4: Test Chatbot (Simple Question)

```bash
curl -X POST http://localhost:5000/api/v1/chatbot \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is BMI?"}'

# Expected:
{
  "success": true,
  "data": {
    "userMessage": "What is BMI?",
    "reply": "BMI (Body Mass Index) is a measure of...",
    "intent": "health_calculation",
    "model": "mixtral-8x7b-32768",
    "stores": null,
    "hasStoreResults": false,
    "tokensEstimate": 45,
    "timestamp": "2026-04-22T..."
  },
  "message": "Response ready"
}
```

### Test 5: Test Intent Detection (Diabetes Question)

```bash
curl -X POST http://localhost:5000/api/v1/chatbot \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Is biryani safe for diabetes?"}'

# Expected: intent = "diabetes_diet"
{
  "success": true,
  "data": {
    "reply": "Biryani is traditionally high in oil and refined carbs, so it's not ideal for diabetes. However, you can enjoy a small portion occasionally, especially if made with brown rice...",
    "intent": "diabetes_diet",
    ...
  }
}
```

### Test 6: Test Conversation History

```bash
# First message
curl -X POST http://localhost:5000/api/v1/chatbot \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "I am diabetic"}'

# Second message (context preserved)
curl -X POST http://localhost:5000/api/v1/chatbot \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "What should I eat for breakfast?"}'

# AI response should reference diabetes mentioned earlier
{
  "success": true,
  "data": {
    "reply": "As a diabetic, here are healthy breakfast options...",
    ...
  }
}
```

### Test 7: Clear Chat History

```bash
curl -X DELETE http://localhost:5000/api/v1/chatbot/history \
  -H "Authorization: Bearer $TOKEN"

# Expected:
{
  "success": true,
  "data": {},
  "message": "Conversation history cleared ✓"
}
```

---

## 3️⃣ Performance Testing

### Measure Response Time

```bash
time curl -X POST http://localhost:5000/api/v1/chatbot \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is protein?"}'

# Expected: < 2 seconds (cold) or < 100ms (cached)
# real    0m1.876s
# user    0m0.024s
# sys     0m0.012s
```

### Check Cache Performance (Repeat Question)

```bash
# First call (cache miss)
time curl -X POST http://localhost:5000/api/v1/chatbot \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is protein?"}'
# Expected: ~1.8 seconds

# Second call (cache hit)
time curl -X POST http://localhost:5000/api/v1/chatbot \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is protein?"}'
# Expected: ~0.05 seconds (almost instant)
```

---

## 4️⃣ Error Handling Tests

### Test Missing Message

```bash
curl -X POST http://localhost:5000/api/v1/chatbot \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": ""}'

# Expected: 400 Bad Request
{
  "success": false,
  "message": "Message cannot be empty."
}
```

### Test Message Too Long

```bash
curl -X POST http://localhost:5000/api/v1/chatbot \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"message": \"$(python3 -c "print('a' * 2001)")\"}"

# Expected: 400 Bad Request
{
  "success": false,
  "message": "Message too long. Maximum 2000 characters."
}
```

### Test Invalid Token

```bash
curl -X POST http://localhost:5000/api/v1/chatbot \
  -H "Authorization: Bearer invalid_token" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Expected: 401 Unauthorized
{
  "success": false,
  "message": "Invalid token."
}
```

### Test Missing API Key

```bash
# Temporarily remove GROQ_API_KEY from .env
# Restart server

curl -X POST http://localhost:5000/api/v1/chatbot \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Expected: 503 Service Unavailable
{
  "success": false,
  "message": "AI service not configured. Add GROQ_API_KEY to your .env file."
}
```

---

## 5️⃣ Groq API Validation

### Verify Groq Client Initialization

Check backend console logs for:
```
[Groq] Client initialized successfully
[Groq primary] Model: mixtral-8x7b-32768
```

### Verify API Key Format

```bash
# Your key should look like:
gsk_your_actual_key_here

# NOT:
- sk_... (OpenAI format)
- ghp_... (GitHub format)
```

### Check Model Availability

Visit: https://console.groq.com/docs/models

Expected available models:
- ✅ `mixtral-8x7b-32768` (primary)
- ✅ `llama2-70b-4096` (fallback)

---

## 6️⃣ Load Testing

### Simple Load Test (10 Concurrent Requests)

```bash
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/v1/chatbot \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"message": "What is a calorie?"}' &
done
wait

# Monitor backend console for:
# - No errors
# - Cache hits on repeated questions
# - Response times < 3s
```

### Database Load Test (Generate 100 Meal Plans)

```bash
for i in {1..100}; do
  # Create unique health profile
  curl -X POST http://localhost:5000/api/v1/profile \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"age\": $((20 + RANDOM % 40)),
      \"gender\": \"male\",
      ...
    }"
    
  # Generate meal plan
  curl -X POST http://localhost:5000/api/v1/meal-plans/generate \
    -H "Authorization: Bearer $TOKEN" &
done
wait

# Monitor:
# - No crashes
# - Response times stay consistent
# - MongoDB doesn't disconnect
```

---

## 7️⃣ Validation Checklist

- [ ] ✅ Groq API key is valid
- [ ] ✅ Backend connects to MongoDB
- [ ] ✅ Health check endpoint works
- [ ] ✅ Authentication flow works (register → login)
- [ ] ✅ Health profile creation works
- [ ] ✅ Chatbot responds with Groq
- [ ] ✅ Intent detection categorizes correctly
- [ ] ✅ Conversation history preserved
- [ ] ✅ Cache hits occur on repeat questions
- [ ] ✅ Error handling works for edge cases
- [ ] ✅ Performance is < 2s per response
- [ ] ✅ No memory leaks or crashes
- [ ] ✅ Rate limiting still works
- [ ] ✅ CORS headers correct

---

## 8️⃣ Debug Mode

Enable verbose logging:

```bash
# Backend
DEBUG=dietora:* npm run dev

# Frontend (if testing)
VITE_DEBUG=true npm run dev
```

Check logs for:
```
[Groq] Request sent to API
[Groq] Response received: XXXms
[AI-Cache] Hit for key: ...
[AI-Metrics] Request recorded
```

---

## Summary

✅ **All tests passed?**
- Backend is production-ready
- Groq integration is working
- Performance is acceptable
- Error handling is robust

🚀 **Time to deploy!**

---

## Environment Variables Reference

```bash
# Required
GROQ_API_KEY=gsk_your_key_here

# Optional (but recommended)
GROQ_MODEL=mixtral-8x7b-32768
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dietora
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
```

---

**Last Tested:** April 22, 2026  
**Status:** ✅ All Systems Operational
