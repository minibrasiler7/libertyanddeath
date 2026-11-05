import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk, ImageDraw
import json
import os

class MapZoneSelector:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Liberty and Death - Sélecteur de Zones")
        self.root.geometry("1400x900")
        
        # Variables
        self.map_image = None
        self.photo = None
        self.canvas = None
        self.zones_data = {}
        self.current_region = ""
        self.current_zone_type = "armies"  # armies, support, control
        self.selecting = False
        self.start_x = 0
        self.start_y = 0
        self.current_rect = None
        
        # Régions à définir (basées sur la carte analysée)
        self.regions_to_define = [
            "Massachusetts", "New York", "Virginia", "Pennsylvania", 
            "North Carolina", "South Carolina", "Georgia", "New Hampshire",
            "Rhode Island", "Connecticut", "New Jersey", "Delaware", 
            "Maryland", "Quebec", "Canada", "East Florida", "West Florida"
        ]
        
        self.setup_ui()
        self.load_map()
    
    def setup_ui(self):
        # Frame principal
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Frame de contrôle
        control_frame = ttk.Frame(main_frame)
        control_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Sélection de région
        ttk.Label(control_frame, text="Région:").pack(side=tk.LEFT, padx=(0, 5))
        self.region_var = tk.StringVar()
        self.region_combo = ttk.Combobox(control_frame, textvariable=self.region_var, 
                                        values=self.regions_to_define, width=20)
        self.region_combo.pack(side=tk.LEFT, padx=(0, 10))
        self.region_combo.bind('<<ComboboxSelected>>', self.on_region_change)
        
        # Sélection du type de zone
        ttk.Label(control_frame, text="Type de zone:").pack(side=tk.LEFT, padx=(10, 5))
        self.zone_type_var = tk.StringVar(value="armies")
        zone_types = [
            ("Armées/Unités", "armies"),
            ("Support/Opposition", "support"),
            ("Contrôle", "control")
        ]
        for text, value in zone_types:
            ttk.Radiobutton(control_frame, text=text, variable=self.zone_type_var, 
                           value=value, command=self.on_zone_type_change).pack(side=tk.LEFT, padx=5)
        
        # Boutons d'action
        button_frame = ttk.Frame(control_frame)
        button_frame.pack(side=tk.RIGHT)
        
        ttk.Button(button_frame, text="Sauvegarder", 
                  command=self.save_zones).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Charger", 
                  command=self.load_zones).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Effacer Zone", 
                  command=self.clear_current_zone).pack(side=tk.LEFT, padx=5)
        
        # Frame pour la carte
        map_frame = ttk.Frame(main_frame)
        map_frame.pack(fill=tk.BOTH, expand=True)
        
        # Canvas avec scrollbars
        canvas_frame = ttk.Frame(map_frame)
        canvas_frame.pack(fill=tk.BOTH, expand=True)
        
        self.canvas = tk.Canvas(canvas_frame, bg='white')
        
        h_scroll = ttk.Scrollbar(canvas_frame, orient=tk.HORIZONTAL, command=self.canvas.xview)
        v_scroll = ttk.Scrollbar(canvas_frame, orient=tk.VERTICAL, command=self.canvas.yview)
        
        self.canvas.configure(xscrollcommand=h_scroll.set, yscrollcommand=v_scroll.set)
        
        h_scroll.pack(side=tk.BOTTOM, fill=tk.X)
        v_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        self.canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        # Bindings pour la sélection
        self.canvas.bind("<Button-1>", self.start_selection)
        self.canvas.bind("<B1-Motion>", self.update_selection)
        self.canvas.bind("<ButtonRelease-1>", self.end_selection)
        
        # Frame d'information
        info_frame = ttk.Frame(main_frame)
        info_frame.pack(fill=tk.X, pady=(10, 0))
        
        self.info_text = tk.Text(info_frame, height=6, width=50)
        self.info_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        info_scroll = ttk.Scrollbar(info_frame, command=self.info_text.yview)
        self.info_text.configure(yscrollcommand=info_scroll.set)
        info_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.update_info()
    
    def load_map(self):
        map_path = "/Users/loicstrauch/PycharmProjects/libertyanddeath/Images/Map/LODmap_VASSAL (resize).jpg"
        try:
            self.map_image = Image.open(map_path)
            # Redimensionner si trop grande
            max_size = (1200, 800)
            self.map_image.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            self.photo = ImageTk.PhotoImage(self.map_image)
            self.canvas.create_image(0, 0, anchor=tk.NW, image=self.photo)
            self.canvas.configure(scrollregion=self.canvas.bbox("all"))
            
            self.log_info("Carte chargée avec succès")
        except Exception as e:
            messagebox.showerror("Erreur", f"Impossible de charger la carte: {str(e)}")
    
    def on_region_change(self, event=None):
        self.current_region = self.region_var.get()
        self.update_display()
        self.log_info(f"Région sélectionnée: {self.current_region}")
    
    def on_zone_type_change(self):
        self.current_zone_type = self.zone_type_var.get()
        self.update_display()
        self.log_info(f"Type de zone: {self.current_zone_type}")
    
    def start_selection(self, event):
        if not self.current_region:
            messagebox.showwarning("Attention", "Veuillez d'abord sélectionner une région")
            return
        
        self.selecting = True
        self.start_x = self.canvas.canvasx(event.x)
        self.start_y = self.canvas.canvasy(event.y)
    
    def update_selection(self, event):
        if not self.selecting:
            return
        
        cur_x = self.canvas.canvasx(event.x)
        cur_y = self.canvas.canvasy(event.y)
        
        if self.current_rect:
            self.canvas.delete(self.current_rect)
        
        # Couleur selon le type de zone
        colors = {
            "armies": "red",
            "support": "blue", 
            "control": "green"
        }
        color = colors.get(self.current_zone_type, "red")
        
        self.current_rect = self.canvas.create_rectangle(
            self.start_x, self.start_y, cur_x, cur_y,
            outline=color, width=2, stipple="gray50"
        )
    
    def end_selection(self, event):
        if not self.selecting:
            return
        
        self.selecting = False
        end_x = self.canvas.canvasx(event.x)
        end_y = self.canvas.canvasy(event.y)
        
        # Enregistrer la zone
        zone_data = {
            "x1": min(self.start_x, end_x),
            "y1": min(self.start_y, end_y),
            "x2": max(self.start_x, end_x),
            "y2": max(self.start_y, end_y)
        }
        
        if self.current_region not in self.zones_data:
            self.zones_data[self.current_region] = {}
        
        self.zones_data[self.current_region][self.current_zone_type] = zone_data
        
        self.update_display()
        self.update_info()
        self.log_info(f"Zone {self.current_zone_type} définie pour {self.current_region}")
    
    def update_display(self):
        # Effacer les rectangles de sélection temporaires
        if self.current_rect:
            self.canvas.delete(self.current_rect)
            self.current_rect = None
        
        # Redessiner toutes les zones définies
        self.canvas.delete("zone_rect")
        
        colors = {"armies": "red", "support": "blue", "control": "green"}
        
        for region, zones in self.zones_data.items():
            for zone_type, zone_data in zones.items():
                color = colors.get(zone_type, "black")
                # Ligne plus épaisse si c'est la région/type actuel
                width = 3 if region == self.current_region and zone_type == self.current_zone_type else 2
                
                self.canvas.create_rectangle(
                    zone_data["x1"], zone_data["y1"],
                    zone_data["x2"], zone_data["y2"],
                    outline=color, width=width, tags="zone_rect"
                )
                
                # Ajouter un label
                center_x = (zone_data["x1"] + zone_data["x2"]) / 2
                center_y = (zone_data["y1"] + zone_data["y2"]) / 2
                self.canvas.create_text(
                    center_x, center_y, text=f"{region}\\n{zone_type}",
                    fill=color, font=("Arial", 8, "bold"), tags="zone_rect"
                )
    
    def clear_current_zone(self):
        if not self.current_region:
            messagebox.showwarning("Attention", "Veuillez sélectionner une région")
            return
        
        if (self.current_region in self.zones_data and 
            self.current_zone_type in self.zones_data[self.current_region]):
            del self.zones_data[self.current_region][self.current_zone_type]
            if not self.zones_data[self.current_region]:
                del self.zones_data[self.current_region]
            
            self.update_display()
            self.update_info()
            self.log_info(f"Zone {self.current_zone_type} effacée pour {self.current_region}")
    
    def save_zones(self):
        file_path = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")],
            initialname="map_zones.json"
        )
        
        if file_path:
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(self.zones_data, f, indent=2, ensure_ascii=False)
                messagebox.showinfo("Succès", f"Zones sauvegardées dans {file_path}")
                self.log_info(f"Zones sauvegardées: {file_path}")
            except Exception as e:
                messagebox.showerror("Erreur", f"Erreur lors de la sauvegarde: {str(e)}")
    
    def load_zones(self):
        file_path = filedialog.askopenfilename(
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        
        if file_path:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    self.zones_data = json.load(f)
                self.update_display()
                self.update_info()
                messagebox.showinfo("Succès", f"Zones chargées depuis {file_path}")
                self.log_info(f"Zones chargées: {file_path}")
            except Exception as e:
                messagebox.showerror("Erreur", f"Erreur lors du chargement: {str(e)}")
    
    def update_info(self):
        self.info_text.delete(1.0, tk.END)
        
        info = "=== ZONES DÉFINIES ===\\n\\n"
        
        for region in self.regions_to_define:
            status = []
            if region in self.zones_data:
                for zone_type in ["armies", "support", "control"]:
                    if zone_type in self.zones_data[region]:
                        status.append(f"✓ {zone_type}")
                    else:
                        status.append(f"✗ {zone_type}")
            else:
                status = ["✗ armies", "✗ support", "✗ control"]
            
            info += f"{region}: {' | '.join(status)}\\n"
        
        self.info_text.insert(1.0, info)
    
    def log_info(self, message):
        print(f"[MapSelector] {message}")
    
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    app = MapZoneSelector()
    app.run()