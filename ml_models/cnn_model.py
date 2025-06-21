import sys
import json
import tensorflow as tf
from keras.preprocessing import image
import numpy as np
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # 0 = all logs, 1 = info, 2 = warning, 3 = error


# Define model and class names paths
MODEL_PATH = os.path.join(os.path.dirname(__file__), "plant_disease_model.keras")
CLASS_MAP_PATH = os.path.join(os.path.dirname(__file__), "class_names.json")

# Load model
model = tf.keras.models.load_model(MODEL_PATH)

# Load class names
with open(CLASS_MAP_PATH, 'r') as f:
    class_names = json.load(f)

def predict_disease(img_path):
    # Load image
    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = tf.expand_dims(img_array, 0)  # Add batch dimension

    # Predict
    predictions = model.predict(img_array)
    predicted_index = np.argmax(predictions[0])

    # Fix: Convert index to string for dictionary key lookup
    predicted_label = class_names[str(predicted_index)]
    confidence = float(np.max(predictions[0]))

    result = {
        "predicted_label": predicted_label,
        "confidence": round(confidence, 4)
    }


    sys.stdout.write(json.dumps(result))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python cnn_model.py <image_path>")
    else:
        predict_disease(sys.argv[1])
