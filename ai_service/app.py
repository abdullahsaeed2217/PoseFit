import gradio as gr
import tensorflow as tf
import numpy as np
import h5py
import json

def repair_and_load_model(model_path):
    with h5py.File(model_path, 'a') as f:
        if 'model_config' in f.attrs:
            # FIX: Removed .decode() because it's already a string
            config_raw = f.attrs['model_config']
            if isinstance(config_raw, bytes):
                config_raw = config_raw.decode('utf-8')
                
            config = json.loads(config_raw)
            
            def clean_config(obj):
                if isinstance(obj, dict):
                    obj.pop('quantization_config', None)
                    obj.pop('optional', None)
                    if 'batch_shape' in obj:
                        obj['batch_input_shape'] = obj.pop('batch_shape')
                    for k, v in obj.items():
                        clean_config(v)
                elif isinstance(obj, list):
                    for item in obj:
                        clean_config(item)

            clean_config(config)
            f.attrs['model_config'] = json.dumps(config)
    
    return tf.keras.models.load_model(model_path, compile=False)

model = repair_and_load_model("fitness_model.h5")
ACTIONS = ['plank', 'push-up', 'squat', 'barbell biceps curl', 'hammer curl', 'pull Up']

def predict(landmarks_json):
    try:
        data = np.array(landmarks_json).reshape(1, 30, 132)
        prediction = model.predict(data)
        action_idx = np.argmax(prediction)
        confidence = float(np.max(prediction))
        
        return {
            "exercise": ACTIONS[action_idx],
            "confidence": round(confidence * 100, 2)
        }
    except Exception as e:
        return {"error": str(e)}

iface = gr.Interface(fn=predict, inputs="json", outputs="json")
iface.launch()
