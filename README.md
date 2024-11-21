# **Clinica Franquito**

Una pagina web que se encarga de administrar las actividades de una clinica la cual tiene pacientes, especialistas y administradores

---

## **Índice**

- [Tecnologías Utilizadas](#tecnologías-utilizadas)  
- [Roles y Funcionalidades](#roles-y-funcionalidades)  
  - [Pacientes](#pacientes)  
  - [Especialistas](#especialistas)  
  - [Administrador](#administrador)  
- [Componentes Principales](#componentes-principales)  
- [Imágenes de Ejemplo](#imágenes-de-ejemplo)  

---

## **Tecnologías Utilizadas**

- **Frontend**: Angular (con componentes standalone y Angular animations).  
- **Backend**: Firebase (autenticación, base de datos y storage).  
- **Hosting**: Firebase.  

---

## **Roles y Funcionalidades**

### **Pacientes**
Los pacientes pueden:  
1. **Registrarse** en la plataforma mediante un formulario intuitivo.  
2. **Solicitar turnos** eligiendo entre los especialistas disponibles y horarios libres.  
3. **Consultar sus turnos** confirmados o pendientes.  
4. **Descargar su Historia Clinica** con la información que anotaron los medicos luego de su visita.

---

### **Especialistas**
Los especialistas tienen acceso a:  
1. **Gestionar sus horarios** disponibles para turnos.  
2. **Visualizar sus turnos programados** con detalles de los pacientes.  
3. **Aceptar o rechazar solicitudes** de turnos pendientes.  
4. **Generar Historias Clinicas**, a los paciente que el atendió.

---

### **Administrador**
El administrador puede:  
1. **Registrar nuevos usuarios** como especialistas o pacientes.  
2. **Consultar informes** con datos estadísticos sobre la actividad en la plataforma.  
3. **Habilitar a los especialistas** dandole mas seguridad a la responsabilidad de los usuarios.  
4. **Gestionar turnos** obteniendo toda la informacion de los turnos.  

---

## **Componentes Principales**

### **1. Registro**
Vista de seleccionado de Registro. Incluye validaciones.  
![Registro](images/registro.jpg) <!-- Añadir imagen de ejemplo -->

### **2. Selección de Turnos**  
Interfaz interactiva para que los pacientes seleccionen turnos según disponibilidad.  
![Selección de Turnos](images/seleccionturnos.jpg) <!-- Añadir imagen de ejemplo -->

### **3. Vista de Turnos**  
Permite a los especialistas y pacientes ver sus turnos en listas filtradas.  
![Vista de Turnos](images/turnos.jpg) <!-- Añadir imagen de ejemplo -->

### **4. Perfil de Usuario**  
Sección personalizada para que cada usuario administre sus datos.  
![Perfil de Usuario](images/perfil.jpg) <!-- Añadir imagen de ejemplo -->

### **5. Informes Administrativos**  
Gráficos y datos relevantes para la gestión administrativa.  
![Informes Administrativos](images/informes.jpg) <!-- Añadir imagen de ejemplo -->

