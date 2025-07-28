from ultralytics import YOLO
import torch
import sys
import os

def car_train_model():
    if not torch.cuda.is_available():
        print("Lỗi: GPU không khả dụng. Vui lòng kiểm tra cài đặt CUDA và driver GPU.")
        sys.exit(1)

    model = YOLO("yolo12n.pt")

    model.train(
        data=r"D:\PROJECTS\Traffic Detection using YOLO\data.yaml",  
        epochs=1,         
        imgsz=640,          
        batch=8,           
        device=0,          
        workers=4,          
        project=r"D:\PROJECTS\Traffic Detection using YOLO\runs\train_car",  
        name="exp_car",  
        exist_ok=True,     
        patience=20,       
        save_period=10,    
        val=True            
    )
    print("Done 1")
    

def bike_train_model():
    if not torch.cuda.is_available():
        print("Lỗi: GPU không khả dụng. Vui lòng kiểm tra cài đặt CUDA và driver GPU.")
        sys.exit(1)

    model = YOLO("yolo12n.pt")

    model.train(
        data=r"D:\PROJECTS\Traffic Detection using YOLO\data_helmet.yaml", 
        epochs=1,         
        imgsz=640,          
        batch=8,           
        device=0,           
        workers=4,          
        project=r"D:\PROJECTS\Traffic Detection using YOLO\runs\train_bike",
        name="exp_bike", 
        exist_ok=True,    
        patience=20,      
        save_period=10,     
        val=True            
    )
    print("Done 2")

if __name__ == "__main__":
    car_train_model()
    # bike_train_model()