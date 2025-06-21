# ml_models/rebuild_and_convert.py

import tensorflow as tf

# Recreate the model architecture (must match original exactly)
def build_model():
    model = tf.keras.models.Sequential([
        tf.keras.layers.Input(shape=(224, 224, 3)),
        tf.keras.layers.Conv2D(32, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D(2, 2),
        tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D(2, 2),
        tf.keras.layers.Conv2D(128, (3, 3), activation='relu'),
        tf.keras.layers.MaxPooling2D(2, 2),
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(128, activation='relu'),
        tf.keras.layers.Dense(15, activation='softmax')  # use correct number of classes
    ])
    return model

# Build model and load weights
model = build_model()
model.load_weights('plant_disease_model.h5')  # Only weights, not full model

# Save in new safer format
model.save('plant_disease_model.keras', save_format='keras')
print("✅ Model rebuilt and saved as .keras")
