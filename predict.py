import sys
import json
import random

# In a real scenario, you would use:
# import joblib
# model = joblib.load("model.pkl")

def get_prediction(age, height, weight):
    # This is a placeholder for your actual model.predict() logic
    # BMI calculation as a proxy for the model logic
    bmi = weight / ((height / 100) ** 2)
    
    if bmi < 14.5:
        return "Severe"
    elif bmi < 16.0:
        return "Moderate"
    else:
        return "Normal"

def get_suggestion(status):
    if status == "Severe":
        return {
            "status": "Severely Malnourished",
            "alert": "⚠️ High Risk Child",
            "solution": "Immediate doctor visit, high-protein diet (eggs, milk, dal), and specialized supplements."
        }
    elif status == "Moderate":
        return {
            "status": "Malnourished",
            "alert": "⚠️ Needs Attention",
            "solution": "Improve nutrition, provide extra milk and eggs, and weekly weight monitoring."
        }
    else:
        return {
            "status": "Normal",
            "alert": "✅ Healthy",
            "solution": "Maintain current balanced diet and encourage physical activity."
        }

if __name__ == "__main__":
    try:
        # Read data from Node.js
        input_data = json.loads(sys.argv[1])
        
        age = input_data.get('age', 24)
        height = input_data.get('height', 80)
        weight = input_data.get('weight', 10)
        
        # Real ML logic would go here:
        # prediction = model.predict([[age, height, weight]])[0]
        prediction = get_prediction(age, height, weight)
        
        result = get_suggestion(prediction)
        
        # Output as JSON for Node.js to read
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
