// Sketch Fiesta — bilingual word data.
//
// Structure (investor feedback item 11 — difficulty modes + categories):
//   window.WORD_MODES = {
//     kids:     { label, labelEs, tier, categories: { catKey: { label, labelEs, words: [ {en, es}, ... ] } } },
//     family:   { ... },
//     advanced: { ... }
//   }
//
// Each mode offers ~10 categories; each category holds a curated starter set of
// bilingual EN/ES pairs (clean, real, age-appropriate — no gibberish/dupes).
// At game start the UI picks 5 random categories from the chosen mode (via the
// seedable window.GameRng) and only draws words from those 5 for that game.
//
// A flattened, tier-tagged window.WORD_BANK is also derived at the bottom so any
// older code path keeps working unchanged. words.js stays the single source of
// word data; lib/* is frozen and untouched.
(function () {
  "use strict";

  window.WORD_MODES = {
    // =====================================================================
    // KIDS — simple, concrete, easy-to-draw nouns and basic actions.
    // =====================================================================
    kids: {
      label: "Kids", labelEs: "Niños", tier: "kids",
      categories: {
        animals: { label: "Animals", labelEs: "Animales", words: [
          { en: "Dog", es: "Perro" }, { en: "Cat", es: "Gato" },
          { en: "Fish", es: "Pez" }, { en: "Bird", es: "Pájaro" },
          { en: "Cow", es: "Vaca" }, { en: "Pig", es: "Cerdo" },
          { en: "Duck", es: "Pato" }, { en: "Frog", es: "Rana" },
          { en: "Horse", es: "Caballo" }, { en: "Sheep", es: "Oveja" },
          { en: "Chicken", es: "Gallina" }, { en: "Rabbit", es: "Conejo" },
          { en: "Mouse", es: "Ratón" }, { en: "Bear", es: "Oso" },
          { en: "Lion", es: "León" }, { en: "Tiger", es: "Tigre" },
          { en: "Elephant", es: "Elefante" }, { en: "Monkey", es: "Mono" },
          { en: "Snake", es: "Serpiente" }, { en: "Turtle", es: "Tortuga" },
          { en: "Bee", es: "Abeja" }, { en: "Butterfly", es: "Mariposa" },
          { en: "Spider", es: "Araña" }, { en: "Ant", es: "Hormiga" },
          { en: "Owl", es: "Búho" }, { en: "Penguin", es: "Pingüino" },
          { en: "Whale", es: "Ballena" }, { en: "Shark", es: "Tiburón" },
          { en: "Crab", es: "Cangrejo" }, { en: "Octopus", es: "Pulpo" },
          { en: "Giraffe", es: "Jirafa" }, { en: "Zebra", es: "Cebra" },
          { en: "Fox", es: "Zorro" }, { en: "Wolf", es: "Lobo" },
          { en: "Deer", es: "Venado" }, { en: "Goat", es: "Cabra" },
          { en: "Dolphin", es: "Delfín" }, { en: "Kangaroo", es: "Canguro" },
          { en: "Snail", es: "Caracol" }, { en: "Ladybug", es: "Mariquita" }
        ]},
        food: { label: "Food", labelEs: "Comida", words: [
          { en: "Apple", es: "Manzana" }, { en: "Banana", es: "Plátano" },
          { en: "Orange", es: "Naranja" }, { en: "Grapes", es: "Uvas" },
          { en: "Strawberry", es: "Fresa" }, { en: "Watermelon", es: "Sandía" },
          { en: "Cake", es: "Pastel" }, { en: "Cookie", es: "Galleta" },
          { en: "Egg", es: "Huevo" }, { en: "Bread", es: "Pan" },
          { en: "Cheese", es: "Queso" }, { en: "Milk", es: "Leche" },
          { en: "Pizza", es: "Pizza" }, { en: "Ice cream", es: "Helado" },
          { en: "Candy", es: "Dulce" }, { en: "Carrot", es: "Zanahoria" },
          { en: "Corn", es: "Maíz" }, { en: "Tomato", es: "Tomate" },
          { en: "Potato", es: "Papa" }, { en: "Hamburger", es: "Hamburguesa" },
          { en: "Hot dog", es: "Perro caliente" }, { en: "French fries", es: "Papas fritas" },
          { en: "Lemon", es: "Limón" }, { en: "Pear", es: "Pera" },
          { en: "Pineapple", es: "Piña" }, { en: "Cherry", es: "Cereza" },
          { en: "Donut", es: "Dona" }, { en: "Popcorn", es: "Palomitas" },
          { en: "Soup", es: "Sopa" }, { en: "Rice", es: "Arroz" },
          { en: "Taco", es: "Taco" }, { en: "Honey", es: "Miel" },
          { en: "Juice", es: "Jugo" }, { en: "Water", es: "Agua" },
          { en: "Chocolate", es: "Chocolate" }, { en: "Sandwich", es: "Sándwich" },
          { en: "Lollipop", es: "Paleta" }, { en: "Mushroom", es: "Hongo" },
          { en: "Salad", es: "Ensalada" }, { en: "Spaghetti", es: "Espagueti" }
        ]},
        toys: { label: "Toys", labelEs: "Juguetes", words: [
          { en: "Ball", es: "Pelota" }, { en: "Doll", es: "Muñeca" },
          { en: "Teddy bear", es: "Osito de peluche" }, { en: "Kite", es: "Cometa" },
          { en: "Blocks", es: "Bloques" }, { en: "Puzzle", es: "Rompecabezas" },
          { en: "Toy car", es: "Carrito" }, { en: "Train", es: "Tren" },
          { en: "Drum", es: "Tambor" }, { en: "Balloon", es: "Globo" },
          { en: "Top", es: "Trompo" }, { en: "Yo-yo", es: "Yoyo" },
          { en: "Jump rope", es: "Cuerda para saltar" }, { en: "Marbles", es: "Canicas" },
          { en: "Robot toy", es: "Robot de juguete" }, { en: "Slide", es: "Resbaladilla" },
          { en: "Swing", es: "Columpio" }, { en: "Sandbox", es: "Caja de arena" },
          { en: "Crayon", es: "Crayón" }, { en: "Bubbles", es: "Burbujas" },
          { en: "Spinning top", es: "Peonza" }, { en: "Whistle", es: "Silbato" },
          { en: "Toy plane", es: "Avión de juguete" }, { en: "Building bricks", es: "Ladrillos de juguete" },
          { en: "Rocking horse", es: "Caballito de madera" }, { en: "Stuffed animal", es: "Peluche" },
          { en: "Toy boat", es: "Barco de juguete" }, { en: "Frisbee", es: "Disco volador" },
          { en: "Hula hoop", es: "Aro" }, { en: "Skateboard", es: "Patineta" }
        ]},
        home: { label: "Home", labelEs: "Casa", words: [
          { en: "House", es: "Casa" }, { en: "Door", es: "Puerta" },
          { en: "Window", es: "Ventana" }, { en: "Bed", es: "Cama" },
          { en: "Chair", es: "Silla" }, { en: "Table", es: "Mesa" },
          { en: "Lamp", es: "Lámpara" }, { en: "Clock", es: "Reloj" },
          { en: "Cup", es: "Taza" }, { en: "Plate", es: "Plato" },
          { en: "Spoon", es: "Cuchara" }, { en: "Fork", es: "Tenedor" },
          { en: "Knife", es: "Cuchillo" }, { en: "Pillow", es: "Almohada" },
          { en: "Blanket", es: "Cobija" }, { en: "Sofa", es: "Sofá" },
          { en: "Television", es: "Televisión" }, { en: "Phone", es: "Teléfono" },
          { en: "Key", es: "Llave" }, { en: "Broom", es: "Escoba" },
          { en: "Mirror", es: "Espejo" }, { en: "Bathtub", es: "Bañera" },
          { en: "Toilet", es: "Inodoro" }, { en: "Stairs", es: "Escaleras" },
          { en: "Refrigerator", es: "Refrigerador" }, { en: "Stove", es: "Estufa" },
          { en: "Bowl", es: "Tazón" }, { en: "Towel", es: "Toalla" },
          { en: "Soap", es: "Jabón" }, { en: "Bucket", es: "Cubeta" }
        ]},
        body: { label: "Body", labelEs: "Cuerpo", words: [
          { en: "Hand", es: "Mano" }, { en: "Foot", es: "Pie" },
          { en: "Head", es: "Cabeza" }, { en: "Eye", es: "Ojo" },
          { en: "Ear", es: "Oreja" }, { en: "Nose", es: "Nariz" },
          { en: "Mouth", es: "Boca" }, { en: "Hair", es: "Cabello" },
          { en: "Arm", es: "Brazo" }, { en: "Leg", es: "Pierna" },
          { en: "Finger", es: "Dedo" }, { en: "Tooth", es: "Diente" },
          { en: "Tongue", es: "Lengua" }, { en: "Knee", es: "Rodilla" },
          { en: "Toe", es: "Dedo del pie" }, { en: "Heart", es: "Corazón" },
          { en: "Smile", es: "Sonrisa" }, { en: "Belly", es: "Barriga" },
          { en: "Shoulder", es: "Hombro" }, { en: "Elbow", es: "Codo" },
          { en: "Cheek", es: "Mejilla" }, { en: "Eyebrow", es: "Ceja" },
          { en: "Neck", es: "Cuello" }, { en: "Back", es: "Espalda" },
          { en: "Chin", es: "Barbilla" }, { en: "Wrist", es: "Muñeca" },
          { en: "Thumb", es: "Pulgar" }, { en: "Beard", es: "Barba" },
          { en: "Eyelash", es: "Pestaña" }, { en: "Skin", es: "Piel" }
        ]},
        colorsShapes: { label: "Colors & Shapes", labelEs: "Colores y formas", words: [
          { en: "Red", es: "Rojo" }, { en: "Blue", es: "Azul" },
          { en: "Green", es: "Verde" }, { en: "Yellow", es: "Amarillo" },
          { en: "Orange", es: "Anaranjado" }, { en: "Purple", es: "Morado" },
          { en: "Pink", es: "Rosa" }, { en: "Brown", es: "Café" },
          { en: "Black", es: "Negro" }, { en: "White", es: "Blanco" },
          { en: "Gray", es: "Gris" }, { en: "Circle", es: "Círculo" },
          { en: "Square", es: "Cuadrado" }, { en: "Triangle", es: "Triángulo" },
          { en: "Star", es: "Estrella" }, { en: "Heart", es: "Corazón" },
          { en: "Rectangle", es: "Rectángulo" }, { en: "Diamond", es: "Rombo" },
          { en: "Oval", es: "Óvalo" }, { en: "Arrow", es: "Flecha" },
          { en: "Cross", es: "Cruz" }, { en: "Spiral", es: "Espiral" },
          { en: "Crescent", es: "Media luna" }, { en: "Cube", es: "Cubo" }
        ]},
        nature: { label: "Nature", labelEs: "Naturaleza", words: [
          { en: "Sun", es: "Sol" }, { en: "Moon", es: "Luna" },
          { en: "Star", es: "Estrella" }, { en: "Tree", es: "Árbol" },
          { en: "Flower", es: "Flor" }, { en: "Cloud", es: "Nube" },
          { en: "Rain", es: "Lluvia" }, { en: "Snow", es: "Nieve" },
          { en: "Mountain", es: "Montaña" }, { en: "River", es: "Río" },
          { en: "Beach", es: "Playa" }, { en: "Rainbow", es: "Arcoíris" },
          { en: "Leaf", es: "Hoja" }, { en: "Grass", es: "Pasto" },
          { en: "Rock", es: "Roca" }, { en: "Sea", es: "Mar" },
          { en: "Wind", es: "Viento" }, { en: "Fire", es: "Fuego" },
          { en: "Lake", es: "Lago" }, { en: "Sky", es: "Cielo" },
          { en: "Island", es: "Isla" }, { en: "Forest", es: "Bosque" },
          { en: "Cave", es: "Cueva" }, { en: "Waterfall", es: "Cascada" },
          { en: "Seashell", es: "Concha" }, { en: "Lightning", es: "Relámpago" },
          { en: "Volcano", es: "Volcán" }, { en: "Desert", es: "Desierto" },
          { en: "Puddle", es: "Charco" }, { en: "Sunset", es: "Atardecer" }
        ]},
        vehicles: { label: "Vehicles", labelEs: "Vehículos", words: [
          { en: "Car", es: "Carro" }, { en: "Bus", es: "Autobús" },
          { en: "Train", es: "Tren" }, { en: "Airplane", es: "Avión" },
          { en: "Boat", es: "Barco" }, { en: "Bicycle", es: "Bicicleta" },
          { en: "Motorcycle", es: "Motocicleta" }, { en: "Truck", es: "Camión" },
          { en: "Helicopter", es: "Helicóptero" }, { en: "Rocket", es: "Cohete" },
          { en: "Fire truck", es: "Camión de bomberos" }, { en: "Police car", es: "Patrulla" },
          { en: "Ambulance", es: "Ambulancia" }, { en: "Tractor", es: "Tractor" },
          { en: "Submarine", es: "Submarino" }, { en: "Scooter", es: "Patín del diablo" },
          { en: "Sailboat", es: "Velero" }, { en: "Taxi", es: "Taxi" },
          { en: "Van", es: "Camioneta" }, { en: "Wagon", es: "Carreta" },
          { en: "Canoe", es: "Canoa" }, { en: "Hot air balloon", es: "Globo aerostático" },
          { en: "Ship", es: "Buque" }, { en: "Tricycle", es: "Triciclo" }
        ]},
        clothes: { label: "Clothes", labelEs: "Ropa", words: [
          { en: "Hat", es: "Sombrero" }, { en: "Shoe", es: "Zapato" },
          { en: "Shirt", es: "Camisa" }, { en: "Pants", es: "Pantalones" },
          { en: "Dress", es: "Vestido" }, { en: "Socks", es: "Calcetines" },
          { en: "Coat", es: "Abrigo" }, { en: "Gloves", es: "Guantes" },
          { en: "Scarf", es: "Bufanda" }, { en: "Skirt", es: "Falda" },
          { en: "Boots", es: "Botas" }, { en: "Sweater", es: "Suéter" },
          { en: "Shorts", es: "Pantalones cortos" }, { en: "Pajamas", es: "Pijama" },
          { en: "Belt", es: "Cinturón" }, { en: "Cap", es: "Gorra" },
          { en: "Jacket", es: "Chaqueta" }, { en: "Tie", es: "Corbata" },
          { en: "Sandals", es: "Sandalias" }, { en: "Glasses", es: "Lentes" },
          { en: "Backpack", es: "Mochila" }, { en: "Mittens", es: "Mitones" },
          { en: "Raincoat", es: "Impermeable" }, { en: "Slippers", es: "Pantuflas" }
        ]},
        actions: { label: "Actions", labelEs: "Acciones", words: [
          { en: "Run", es: "Correr" }, { en: "Jump", es: "Saltar" },
          { en: "Sleep", es: "Dormir" }, { en: "Eat", es: "Comer" },
          { en: "Drink", es: "Beber" }, { en: "Sing", es: "Cantar" },
          { en: "Dance", es: "Bailar" }, { en: "Swim", es: "Nadar" },
          { en: "Walk", es: "Caminar" }, { en: "Cry", es: "Llorar" },
          { en: "Laugh", es: "Reír" }, { en: "Read", es: "Leer" },
          { en: "Write", es: "Escribir" }, { en: "Draw", es: "Dibujar" },
          { en: "Climb", es: "Trepar" }, { en: "Throw", es: "Lanzar" },
          { en: "Catch", es: "Atrapar" }, { en: "Kick", es: "Patear" },
          { en: "Clap", es: "Aplaudir" }, { en: "Wave", es: "Saludar con la mano" },
          { en: "Push", es: "Empujar" }, { en: "Pull", es: "Jalar" },
          { en: "Hug", es: "Abrazar" }, { en: "Wash", es: "Lavar" },
          { en: "Cook", es: "Cocinar" }, { en: "Brush teeth", es: "Cepillarse los dientes" },
          { en: "Wave goodbye", es: "Decir adiós" }, { en: "Tiptoe", es: "Caminar de puntillas" }
        ]}
      }
    },

    // =====================================================================
    // FAMILY — everyday objects/actions plus broader cultural categories.
    // =====================================================================
    family: {
      label: "Family", labelEs: "Familia", tier: "family",
      categories: {
        animals: { label: "Animals", labelEs: "Animales", words: [
          { en: "Crocodile", es: "Cocodrilo" }, { en: "Hippopotamus", es: "Hipopótamo" },
          { en: "Rhinoceros", es: "Rinoceronte" }, { en: "Camel", es: "Camello" },
          { en: "Peacock", es: "Pavo real" }, { en: "Flamingo", es: "Flamenco" },
          { en: "Hedgehog", es: "Erizo" }, { en: "Squirrel", es: "Ardilla" },
          { en: "Raccoon", es: "Mapache" }, { en: "Bat", es: "Murciélago" },
          { en: "Seahorse", es: "Caballito de mar" }, { en: "Jellyfish", es: "Medusa" },
          { en: "Starfish", es: "Estrella de mar" }, { en: "Lizard", es: "Lagartija" },
          { en: "Chameleon", es: "Camaleón" }, { en: "Parrot", es: "Loro" },
          { en: "Eagle", es: "Águila" }, { en: "Ostrich", es: "Avestruz" },
          { en: "Gorilla", es: "Gorila" }, { en: "Panda", es: "Panda" },
          { en: "Koala", es: "Koala" }, { en: "Sloth", es: "Perezoso" },
          { en: "Beaver", es: "Castor" }, { en: "Otter", es: "Nutria" },
          { en: "Walrus", es: "Morsa" }, { en: "Seal", es: "Foca" },
          { en: "Toucan", es: "Tucán" }, { en: "Scorpion", es: "Escorpión" }
        ]},
        food: { label: "Food", labelEs: "Comida", words: [
          { en: "Tamale", es: "Tamal" }, { en: "Burrito", es: "Burrito" },
          { en: "Enchilada", es: "Enchilada" }, { en: "Guacamole", es: "Guacamole" },
          { en: "Quesadilla", es: "Quesadilla" }, { en: "Pancakes", es: "Panqueques" },
          { en: "Waffle", es: "Wafle" }, { en: "Cereal", es: "Cereal" },
          { en: "Pasta", es: "Pasta" }, { en: "Steak", es: "Bistec" },
          { en: "Chicken", es: "Pollo" }, { en: "Fish", es: "Pescado" },
          { en: "Shrimp", es: "Camarón" }, { en: "Beans", es: "Frijoles" },
          { en: "Avocado", es: "Aguacate" }, { en: "Pepper", es: "Chile" },
          { en: "Onion", es: "Cebolla" }, { en: "Garlic", es: "Ajo" },
          { en: "Lettuce", es: "Lechuga" }, { en: "Cucumber", es: "Pepino" },
          { en: "Coffee", es: "Café" }, { en: "Tea", es: "Té" },
          { en: "Pie", es: "Tarta" }, { en: "Pudding", es: "Flan" },
          { en: "Cupcake", es: "Magdalena" }, { en: "Muffin", es: "Panqué" },
          { en: "Nachos", es: "Nachos" }, { en: "Salsa", es: "Salsa" },
          { en: "Churros", es: "Churros" }, { en: "Pretzel", es: "Pretzel" }
        ]},
        sports: { label: "Sports", labelEs: "Deportes", words: [
          { en: "Soccer", es: "Fútbol" }, { en: "Basketball", es: "Baloncesto" },
          { en: "Baseball", es: "Béisbol" }, { en: "Tennis", es: "Tenis" },
          { en: "Swimming", es: "Natación" }, { en: "Volleyball", es: "Voleibol" },
          { en: "Boxing", es: "Boxeo" }, { en: "Cycling", es: "Ciclismo" },
          { en: "Skiing", es: "Esquí" }, { en: "Surfing", es: "Surf" },
          { en: "Golf", es: "Golf" }, { en: "Hockey", es: "Hockey" },
          { en: "Football", es: "Fútbol americano" }, { en: "Skating", es: "Patinaje" },
          { en: "Gymnastics", es: "Gimnasia" }, { en: "Karate", es: "Karate" },
          { en: "Wrestling", es: "Lucha libre" }, { en: "Running", es: "Atletismo" },
          { en: "Bowling", es: "Boliche" }, { en: "Fishing", es: "Pesca" },
          { en: "Diving", es: "Buceo" }, { en: "Climbing", es: "Escalada" },
          { en: "Archery", es: "Tiro con arco" }, { en: "Ping pong", es: "Tenis de mesa" },
          { en: "Sailing", es: "Vela" }, { en: "Horseback riding", es: "Equitación" },
          { en: "Snowboarding", es: "Snowboard" }, { en: "Yoga", es: "Yoga" }
        ]},
        places: { label: "Places", labelEs: "Lugares", words: [
          { en: "School", es: "Escuela" }, { en: "Hospital", es: "Hospital" },
          { en: "Park", es: "Parque" }, { en: "Library", es: "Biblioteca" },
          { en: "Beach", es: "Playa" }, { en: "Market", es: "Mercado" },
          { en: "Restaurant", es: "Restaurante" }, { en: "Museum", es: "Museo" },
          { en: "Zoo", es: "Zoológico" }, { en: "Farm", es: "Granja" },
          { en: "Airport", es: "Aeropuerto" }, { en: "Bank", es: "Banco" },
          { en: "Church", es: "Iglesia" }, { en: "Castle", es: "Castillo" },
          { en: "Bridge", es: "Puente" }, { en: "Lighthouse", es: "Faro" },
          { en: "Stadium", es: "Estadio" }, { en: "Bakery", es: "Panadería" },
          { en: "Pharmacy", es: "Farmacia" }, { en: "Gas station", es: "Gasolinera" },
          { en: "Movie theater", es: "Cine" }, { en: "Hotel", es: "Hotel" },
          { en: "Office", es: "Oficina" }, { en: "Factory", es: "Fábrica" },
          { en: "Playground", es: "Parque infantil" }, { en: "Aquarium", es: "Acuario" },
          { en: "Garden", es: "Jardín" }, { en: "City", es: "Ciudad" }
        ]},
        jobs: { label: "Jobs", labelEs: "Trabajos", words: [
          { en: "Doctor", es: "Doctor" }, { en: "Nurse", es: "Enfermera" },
          { en: "Teacher", es: "Maestro" }, { en: "Firefighter", es: "Bombero" },
          { en: "Police officer", es: "Policía" }, { en: "Farmer", es: "Granjero" },
          { en: "Chef", es: "Chef" }, { en: "Pilot", es: "Piloto" },
          { en: "Astronaut", es: "Astronauta" }, { en: "Dentist", es: "Dentista" },
          { en: "Mail carrier", es: "Cartero" }, { en: "Plumber", es: "Plomero" },
          { en: "Carpenter", es: "Carpintero" }, { en: "Painter", es: "Pintor" },
          { en: "Singer", es: "Cantante" }, { en: "Dancer", es: "Bailarín" },
          { en: "Scientist", es: "Científico" }, { en: "Veterinarian", es: "Veterinario" },
          { en: "Mechanic", es: "Mecánico" }, { en: "Waiter", es: "Mesero" },
          { en: "Barber", es: "Barbero" }, { en: "Judge", es: "Juez" },
          { en: "Photographer", es: "Fotógrafo" }, { en: "Lifeguard", es: "Salvavidas" },
          { en: "Clown", es: "Payaso" }, { en: "Magician", es: "Mago" },
          { en: "Soldier", es: "Soldado" }, { en: "Builder", es: "Albañil" }
        ]},
        music: { label: "Music", labelEs: "Música", words: [
          { en: "Guitar", es: "Guitarra" }, { en: "Piano", es: "Piano" },
          { en: "Drum", es: "Tambor" }, { en: "Violin", es: "Violín" },
          { en: "Trumpet", es: "Trompeta" }, { en: "Flute", es: "Flauta" },
          { en: "Saxophone", es: "Saxofón" }, { en: "Harp", es: "Arpa" },
          { en: "Microphone", es: "Micrófono" }, { en: "Headphones", es: "Audífonos" },
          { en: "Maracas", es: "Maracas" }, { en: "Accordion", es: "Acordeón" },
          { en: "Trombone", es: "Trombón" }, { en: "Tambourine", es: "Pandereta" },
          { en: "Xylophone", es: "Xilófono" }, { en: "Cello", es: "Violonchelo" },
          { en: "Banjo", es: "Banjo" }, { en: "Bell", es: "Campana" },
          { en: "Choir", es: "Coro" }, { en: "Orchestra", es: "Orquesta" },
          { en: "Song", es: "Canción" }, { en: "Concert", es: "Concierto" },
          { en: "Music note", es: "Nota musical" }, { en: "Whistle", es: "Silbato" }
        ]},
        moviesTv: { label: "Movies & TV", labelEs: "Cine y TV", words: [
          { en: "Superhero", es: "Superhéroe" }, { en: "Wizard", es: "Mago" },
          { en: "Robot", es: "Robot" }, { en: "Dinosaur", es: "Dinosaurio" },
          { en: "Pirate", es: "Pirata" }, { en: "Ghost", es: "Fantasma" },
          { en: "Alien", es: "Extraterrestre" }, { en: "Vampire", es: "Vampiro" },
          { en: "Mermaid", es: "Sirena" }, { en: "Knight", es: "Caballero" },
          { en: "Princess", es: "Princesa" }, { en: "Dragon", es: "Dragón" },
          { en: "Cowboy", es: "Vaquero" }, { en: "Detective", es: "Detective" },
          { en: "Spy", es: "Espía" }, { en: "Zombie", es: "Zombi" },
          { en: "Monster", es: "Monstruo" }, { en: "Cartoon", es: "Caricatura" },
          { en: "Popcorn", es: "Palomitas" }, { en: "Movie ticket", es: "Boleto de cine" },
          { en: "Remote control", es: "Control remoto" }, { en: "Clapperboard", es: "Claqueta" },
          { en: "Red carpet", es: "Alfombra roja" }, { en: "Cartoon hero", es: "Héroe animado" }
        ]},
        holidays: { label: "Holidays", labelEs: "Fiestas", words: [
          { en: "Birthday", es: "Cumpleaños" }, { en: "Christmas", es: "Navidad" },
          { en: "Halloween", es: "Halloween" }, { en: "Easter", es: "Pascua" },
          { en: "New Year", es: "Año Nuevo" }, { en: "Valentine's Day", es: "Día de San Valentín" },
          { en: "Day of the Dead", es: "Día de Muertos" }, { en: "Thanksgiving", es: "Día de Acción de Gracias" },
          { en: "Fireworks", es: "Fuegos artificiales" }, { en: "Piñata", es: "Piñata" },
          { en: "Gift", es: "Regalo" }, { en: "Costume", es: "Disfraz" },
          { en: "Pumpkin", es: "Calabaza" }, { en: "Santa Claus", es: "Santa Claus" },
          { en: "Christmas tree", es: "Árbol de Navidad" }, { en: "Snowman", es: "Muñeco de nieve" },
          { en: "Candle", es: "Vela" }, { en: "Mask", es: "Máscara" },
          { en: "Parade", es: "Desfile" }, { en: "Balloon", es: "Globo" },
          { en: "Wedding", es: "Boda" }, { en: "Confetti", es: "Confeti" },
          { en: "Crown", es: "Corona" }, { en: "Trick or treat", es: "Dulce o truco" }
        ]},
        nature: { label: "Nature", labelEs: "Naturaleza", words: [
          { en: "Ocean", es: "Océano" }, { en: "Jungle", es: "Selva" },
          { en: "Canyon", es: "Cañón" }, { en: "Glacier", es: "Glaciar" },
          { en: "Tornado", es: "Tornado" }, { en: "Hurricane", es: "Huracán" },
          { en: "Earthquake", es: "Terremoto" }, { en: "Coral reef", es: "Arrecife de coral" },
          { en: "Cactus", es: "Cactus" }, { en: "Palm tree", es: "Palmera" },
          { en: "Sunflower", es: "Girasol" }, { en: "Mushroom", es: "Hongo" },
          { en: "Comet", es: "Cometa" }, { en: "Planet", es: "Planeta" },
          { en: "Meadow", es: "Pradera" }, { en: "Swamp", es: "Pantano" },
          { en: "Cliff", es: "Acantilado" }, { en: "Valley", es: "Valle" },
          { en: "Iceberg", es: "Iceberg" }, { en: "Geyser", es: "Géiser" },
          { en: "Dew", es: "Rocío" }, { en: "Fog", es: "Niebla" },
          { en: "Tide", es: "Marea" }, { en: "Pinecone", es: "Piña de pino" }
        ]},
        household: { label: "Household", labelEs: "Hogar", words: [
          { en: "Vacuum", es: "Aspiradora" }, { en: "Washing machine", es: "Lavadora" },
          { en: "Microwave", es: "Microondas" }, { en: "Toaster", es: "Tostadora" },
          { en: "Blender", es: "Licuadora" }, { en: "Hammer", es: "Martillo" },
          { en: "Screwdriver", es: "Destornillador" }, { en: "Scissors", es: "Tijeras" },
          { en: "Umbrella", es: "Paraguas" }, { en: "Candle", es: "Vela" },
          { en: "Flashlight", es: "Linterna" }, { en: "Ladder", es: "Escalera" },
          { en: "Mop", es: "Trapeador" }, { en: "Iron", es: "Plancha" },
          { en: "Fan", es: "Ventilador" }, { en: "Calendar", es: "Calendario" },
          { en: "Pencil", es: "Lápiz" }, { en: "Notebook", es: "Cuaderno" },
          { en: "Wallet", es: "Cartera" }, { en: "Watch", es: "Reloj de pulsera" },
          { en: "Comb", es: "Peine" }, { en: "Toothbrush", es: "Cepillo de dientes" },
          { en: "Suitcase", es: "Maleta" }, { en: "Camera", es: "Cámara" }
        ]}
      }
    },

    // =====================================================================
    // ADVANCED — abstract concepts, idioms, specialized vocabulary.
    // =====================================================================
    advanced: {
      label: "Advanced", labelEs: "Avanzado", tier: "adults",
      categories: {
        science: { label: "Science", labelEs: "Ciencia", words: [
          { en: "Gravity", es: "Gravedad" }, { en: "Atom", es: "Átomo" },
          { en: "Molecule", es: "Molécula" }, { en: "Photosynthesis", es: "Fotosíntesis" },
          { en: "Evolution", es: "Evolución" }, { en: "Magnetism", es: "Magnetismo" },
          { en: "Electricity", es: "Electricidad" }, { en: "Microscope", es: "Microscopio" },
          { en: "Telescope", es: "Telescopio" }, { en: "Genetics", es: "Genética" },
          { en: "Chemistry", es: "Química" }, { en: "Bacteria", es: "Bacteria" },
          { en: "Vaccine", es: "Vacuna" }, { en: "Ecosystem", es: "Ecosistema" },
          { en: "Galaxy", es: "Galaxia" }, { en: "Black hole", es: "Agujero negro" },
          { en: "Skeleton", es: "Esqueleto" }, { en: "Experiment", es: "Experimento" },
          { en: "Energy", es: "Energía" }, { en: "Friction", es: "Fricción" },
          { en: "Velocity", es: "Velocidad" }, { en: "Fossil", es: "Fósil" },
          { en: "Periodic table", es: "Tabla periódica" }, { en: "DNA", es: "ADN" },
          { en: "Orbit", es: "Órbita" }, { en: "Eclipse", es: "Eclipse" },
          { en: "Radiation", es: "Radiación" }, { en: "Combustion", es: "Combustión" }
        ]},
        geography: { label: "Geography", labelEs: "Geografía", words: [
          { en: "Continent", es: "Continente" }, { en: "Equator", es: "Ecuador" },
          { en: "Peninsula", es: "Península" }, { en: "Archipelago", es: "Archipiélago" },
          { en: "Latitude", es: "Latitud" }, { en: "Compass", es: "Brújula" },
          { en: "Globe", es: "Globo terráqueo" }, { en: "Map", es: "Mapa" },
          { en: "Capital", es: "Capital" }, { en: "Border", es: "Frontera" },
          { en: "Tropics", es: "Trópicos" }, { en: "Tundra", es: "Tundra" },
          { en: "Rainforest", es: "Selva tropical" }, { en: "Plateau", es: "Meseta" },
          { en: "Delta", es: "Delta" }, { en: "Strait", es: "Estrecho" },
          { en: "Hemisphere", es: "Hemisferio" }, { en: "Time zone", es: "Zona horaria" },
          { en: "Population", es: "Población" }, { en: "Climate", es: "Clima" },
          { en: "Coastline", es: "Costa" }, { en: "Mountain range", es: "Cordillera" },
          { en: "Pyramid", es: "Pirámide" }, { en: "Skyscraper", es: "Rascacielos" },
          { en: "Atlas", es: "Atlas" }, { en: "Landmark", es: "Monumento" }
        ]},
        history: { label: "History", labelEs: "Historia", words: [
          { en: "Revolution", es: "Revolución" }, { en: "Empire", es: "Imperio" },
          { en: "Pharaoh", es: "Faraón" }, { en: "Gladiator", es: "Gladiador" },
          { en: "Knight", es: "Caballero" }, { en: "Explorer", es: "Explorador" },
          { en: "Colony", es: "Colonia" }, { en: "Treaty", es: "Tratado" },
          { en: "Monarchy", es: "Monarquía" }, { en: "Conquest", es: "Conquista" },
          { en: "Independence", es: "Independencia" }, { en: "Ancient Rome", es: "Antigua Roma" },
          { en: "Pyramids", es: "Pirámides" }, { en: "Castle", es: "Castillo" },
          { en: "Crusade", es: "Cruzada" }, { en: "Renaissance", es: "Renacimiento" },
          { en: "Dynasty", es: "Dinastía" }, { en: "Migration", es: "Migración" },
          { en: "Civilization", es: "Civilización" }, { en: "Artifact", es: "Artefacto" },
          { en: "Throne", es: "Trono" }, { en: "Scroll", es: "Pergamino" },
          { en: "Cannon", es: "Cañón" }, { en: "Sword", es: "Espada" },
          { en: "Plague", es: "Plaga" }, { en: "Settlement", es: "Asentamiento" }
        ]},
        idioms: { label: "Idioms", labelEs: "Modismos", words: [
          { en: "Break the ice", es: "Romper el hielo" },
          { en: "Piece of cake", es: "Pan comido" },
          { en: "Spill the beans", es: "Soltar la sopa" },
          { en: "Cost an arm and a leg", es: "Costar un ojo de la cara" },
          { en: "Once in a blue moon", es: "De vez en cuando" },
          { en: "Hit the nail on the head", es: "Dar en el clavo" },
          { en: "Under the weather", es: "Sentirse mal" },
          { en: "When pigs fly", es: "Cuando las ranas críen pelo" },
          { en: "Bite the bullet", es: "Hacer de tripas corazón" },
          { en: "Let the cat out of the bag", es: "Revelar el secreto" },
          { en: "The ball is in your court", es: "La pelota está en tu cancha" },
          { en: "Kill two birds with one stone", es: "Matar dos pájaros de un tiro" },
          { en: "Raining cats and dogs", es: "Llover a cántaros" },
          { en: "A blessing in disguise", es: "No hay mal que por bien no venga" },
          { en: "Burning the midnight oil", es: "Quemarse las pestañas" },
          { en: "Cry over spilled milk", es: "Llorar sobre la leche derramada" },
          { en: "Barking up the wrong tree", es: "Equivocarse de objetivo" },
          { en: "Tip of the iceberg", es: "La punta del iceberg" },
          { en: "Throw in the towel", es: "Tirar la toalla" },
          { en: "Out of the blue", es: "De repente" },
          { en: "Cold feet", es: "Echarse para atrás" },
          { en: "Pull someone's leg", es: "Tomar el pelo" },
          { en: "A piece of one's mind", es: "Cantar las verdades" },
          { en: "Speak of the devil", es: "Hablando del rey de Roma" }
        ]},
        abstract: { label: "Abstract concepts", labelEs: "Conceptos abstractos", words: [
          { en: "Freedom", es: "Libertad" }, { en: "Justice", es: "Justicia" },
          { en: "Courage", es: "Valentía" }, { en: "Honesty", es: "Honestidad" },
          { en: "Patience", es: "Paciencia" }, { en: "Loyalty", es: "Lealtad" },
          { en: "Curiosity", es: "Curiosidad" }, { en: "Ambition", es: "Ambición" },
          { en: "Nostalgia", es: "Nostalgia" }, { en: "Jealousy", es: "Celos" },
          { en: "Gratitude", es: "Gratitud" }, { en: "Wisdom", es: "Sabiduría" },
          { en: "Chaos", es: "Caos" }, { en: "Harmony", es: "Armonía" },
          { en: "Doubt", es: "Duda" }, { en: "Hope", es: "Esperanza" },
          { en: "Boredom", es: "Aburrimiento" }, { en: "Sarcasm", es: "Sarcasmo" },
          { en: "Procrastination", es: "Procrastinación" }, { en: "Empathy", es: "Empatía" },
          { en: "Confidence", es: "Confianza" }, { en: "Regret", es: "Arrepentimiento" },
          { en: "Imagination", es: "Imaginación" }, { en: "Déjà vu", es: "Déjà vu" },
          { en: "Tradition", es: "Tradición" }, { en: "Privacy", es: "Privacidad" },
          { en: "Luck", es: "Suerte" }, { en: "Silence", es: "Silencio" }
        ]},
        professions: { label: "Professions", labelEs: "Profesiones", words: [
          { en: "Architect", es: "Arquitecto" }, { en: "Engineer", es: "Ingeniero" },
          { en: "Lawyer", es: "Abogado" }, { en: "Accountant", es: "Contador" },
          { en: "Journalist", es: "Periodista" }, { en: "Surgeon", es: "Cirujano" },
          { en: "Psychologist", es: "Psicólogo" }, { en: "Translator", es: "Traductor" },
          { en: "Electrician", es: "Electricista" }, { en: "Programmer", es: "Programador" },
          { en: "Diplomat", es: "Diplomático" }, { en: "Economist", es: "Economista" },
          { en: "Pharmacist", es: "Farmacéutico" }, { en: "Librarian", es: "Bibliotecario" },
          { en: "Conductor", es: "Director de orquesta" }, { en: "Sculptor", es: "Escultor" },
          { en: "Biologist", es: "Biólogo" }, { en: "Astronomer", es: "Astrónomo" },
          { en: "Geologist", es: "Geólogo" }, { en: "Editor", es: "Editor" },
          { en: "Referee", es: "Árbitro" }, { en: "Tailor", es: "Sastre" },
          { en: "Curator", es: "Curador" }, { en: "Surveyor", es: "Topógrafo" },
          { en: "Anthropologist", es: "Antropólogo" }, { en: "Entrepreneur", es: "Empresario" }
        ]},
        mythology: { label: "Mythology", labelEs: "Mitología", words: [
          { en: "Dragon", es: "Dragón" }, { en: "Unicorn", es: "Unicornio" },
          { en: "Phoenix", es: "Fénix" }, { en: "Minotaur", es: "Minotauro" },
          { en: "Mermaid", es: "Sirena" }, { en: "Centaur", es: "Centauro" },
          { en: "Medusa", es: "Medusa" }, { en: "Cyclops", es: "Cíclope" },
          { en: "Pegasus", es: "Pegaso" }, { en: "Sphinx", es: "Esfinge" },
          { en: "Hercules", es: "Hércules" }, { en: "Zeus", es: "Zeus" },
          { en: "Poseidon", es: "Poseidón" }, { en: "Titan", es: "Titán" },
          { en: "Griffin", es: "Grifo" }, { en: "Werewolf", es: "Hombre lobo" },
          { en: "Goblin", es: "Duende" }, { en: "Troll", es: "Troll" },
          { en: "Oracle", es: "Oráculo" }, { en: "Nymph", es: "Ninfa" },
          { en: "Kraken", es: "Kraken" }, { en: "Hydra", es: "Hidra" },
          { en: "Valkyrie", es: "Valquiria" }, { en: "Quetzalcoatl", es: "Quetzalcóatl" },
          { en: "Chupacabra", es: "Chupacabras" }, { en: "Labyrinth", es: "Laberinto" }
        ]},
        technology: { label: "Technology", labelEs: "Tecnología", words: [
          { en: "Computer", es: "Computadora" }, { en: "Internet", es: "Internet" },
          { en: "Smartphone", es: "Teléfono inteligente" }, { en: "Satellite", es: "Satélite" },
          { en: "Algorithm", es: "Algoritmo" }, { en: "Database", es: "Base de datos" },
          { en: "Artificial intelligence", es: "Inteligencia artificial" }, { en: "Password", es: "Contraseña" },
          { en: "Keyboard", es: "Teclado" }, { en: "Server", es: "Servidor" },
          { en: "Drone", es: "Dron" }, { en: "Virtual reality", es: "Realidad virtual" },
          { en: "Hard drive", es: "Disco duro" }, { en: "Bluetooth", es: "Bluetooth" },
          { en: "Cloud storage", es: "Almacenamiento en la nube" }, { en: "Software", es: "Software" },
          { en: "Circuit", es: "Circuito" }, { en: "Battery", es: "Batería" },
          { en: "Wi-Fi", es: "Wifi" }, { en: "Charger", es: "Cargador" },
          { en: "Printer", es: "Impresora" }, { en: "Microchip", es: "Microchip" },
          { en: "Browser", es: "Navegador" }, { en: "Robot", es: "Robot" },
          { en: "Touchscreen", es: "Pantalla táctil" }, { en: "Email", es: "Correo electrónico" }
        ]},
        art: { label: "Art", labelEs: "Arte", words: [
          { en: "Painting", es: "Pintura" }, { en: "Sculpture", es: "Escultura" },
          { en: "Canvas", es: "Lienzo" }, { en: "Easel", es: "Caballete" },
          { en: "Palette", es: "Paleta" }, { en: "Brush", es: "Pincel" },
          { en: "Portrait", es: "Retrato" }, { en: "Mural", es: "Mural" },
          { en: "Sketch", es: "Bosquejo" }, { en: "Gallery", es: "Galería" },
          { en: "Mosaic", es: "Mosaico" }, { en: "Pottery", es: "Cerámica" },
          { en: "Origami", es: "Origami" }, { en: "Graffiti", es: "Grafiti" },
          { en: "Watercolor", es: "Acuarela" }, { en: "Statue", es: "Estatua" },
          { en: "Frame", es: "Marco" }, { en: "Masterpiece", es: "Obra maestra" },
          { en: "Abstract art", es: "Arte abstracto" }, { en: "Engraving", es: "Grabado" },
          { en: "Collage", es: "Collage" }, { en: "Calligraphy", es: "Caligrafía" },
          { en: "Exhibition", es: "Exposición" }, { en: "Tapestry", es: "Tapiz" }
        ]},
        literature: { label: "Literature", labelEs: "Literatura", words: [
          { en: "Novel", es: "Novela" }, { en: "Poem", es: "Poema" },
          { en: "Chapter", es: "Capítulo" }, { en: "Author", es: "Autor" },
          { en: "Character", es: "Personaje" }, { en: "Plot", es: "Trama" },
          { en: "Metaphor", es: "Metáfora" }, { en: "Library", es: "Biblioteca" },
          { en: "Fairy tale", es: "Cuento de hadas" }, { en: "Fable", es: "Fábula" },
          { en: "Mystery", es: "Misterio" }, { en: "Biography", es: "Biografía" },
          { en: "Dictionary", es: "Diccionario" }, { en: "Encyclopedia", es: "Enciclopedia" },
          { en: "Manuscript", es: "Manuscrito" }, { en: "Verse", es: "Verso" },
          { en: "Narrator", es: "Narrador" }, { en: "Hero", es: "Héroe" },
          { en: "Villain", es: "Villano" }, { en: "Comedy", es: "Comedia" },
          { en: "Tragedy", es: "Tragedia" }, { en: "Riddle", es: "Acertijo" },
          { en: "Legend", es: "Leyenda" }, { en: "Quote", es: "Cita" },
          { en: "Bookmark", es: "Marcapáginas" }, { en: "Epic", es: "Epopeya" }
        ]}
      }
    }
  };

  // ---- Derived flat WORD_BANK (backward compatibility) --------------------
  // Older code expects a flat array of {en, es, tier}. Build it from the modes
  // so words.js remains the single source of truth.
  var bank = [];
  Object.keys(window.WORD_MODES).forEach(function (modeKey) {
    var mode = window.WORD_MODES[modeKey];
    Object.keys(mode.categories).forEach(function (catKey) {
      mode.categories[catKey].words.forEach(function (w) {
        bank.push({ en: w.en, es: w.es, tier: mode.tier, mode: modeKey, category: catKey });
      });
    });
  });
  window.WORD_BANK = bank;
})();
