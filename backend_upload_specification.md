# Backend API Specification for Student Data Upload

## Endpoint

```
POST /api/upload/student-data
```

## Request Format

- **Content-Type:** `multipart/form-data`
- **Authentication:** Bearer token in Authorization header (if implemented)

## Request Parameters

### Form Data Fields:

1. **file** (required)

   - Type: File
   - Accepted formats: CSV, XLS, XLSX
   - Contains student data with the following columns:
     ```
     Matricule, SYS1, RES1, ANUM, RO, ORG, LANG1, IGL, THP, Rang S1, Moy S1,
     MCSI, BDD, SEC, CPROJ, PROJ, LANG2, ARCH, SYS2, RES2, Rang S2, Moy S2,
     Rang, Moy Rachat
     ```
   - **Note: "Affectation" and "Promo" columns are NO LONGER in the file**

2. **promo** (required)
   - Type: String
   - Format: Text (e.g., "2023", "2024", "2025")
   - Description: The promotion/year for all students in this file

### Headers:

```
Authorization: Bearer {jwt_token}  // Optional, if authentication is implemented
Content-Type: multipart/form-data  // Automatically set by browser
```

## Expected Response Format

### Success Response (HTTP 200):

```json
{
  "success": true,
  "message": "Données étudiantes téléchargées avec succès"
}
```

### Error Responses:

**File validation error (HTTP 400):**

```json
{
  "detail": "Format de fichier non supporté. Veuillez utiliser CSV, XLS ou XLSX"
}
```

**Missing promo error (HTTP 400):**

```json
{
  "detail": "La promotion est obligatoire"
}
```

**File processing error (HTTP 400):**

```json
{
  "detail": "Erreur lors du traitement du fichier: [specific error]"
}
```

**Authentication error (HTTP 401):**

```json
{
  "detail": "Token d'authentification invalide"
}
```

**Server error (HTTP 500):**

```json
{
  "detail": "Erreur interne du serveur"
}
```

## Backend Processing Logic

### 1. Request Validation:

```python
# Validate file presence and format
if not file:
    return {"detail": "Fichier manquant"}, 400

if file.content_type not in ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']:
    return {"detail": "Format de fichier non supporté"}, 400

# Validate promo
if not promo or not promo.strip():
    return {"detail": "La promotion est obligatoire"}, 400
```

### 2. File Processing:

```python
# Read and parse the file (example for CSV)
import pandas as pd

try:
    if file.content_type == 'text/csv':
        df = pd.read_csv(file)
    else:  # Excel files
        df = pd.read_excel(file)

    # Validate required columns
    required_columns = [
        "Matricule", "SYS1", "RES1", "ANUM", "RO", "ORG", "LANG1", "IGL", "THP",
        "Rang S1", "Moy S1", "MCSI", "BDD", "SEC", "CPROJ", "PROJ", "LANG2",
        "ARCH", "SYS2", "RES2", "Rang S2", "Moy S2", "Rang", "Moy Rachat"
    ]

    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        return {"detail": f"Colonnes manquantes: {', '.join(missing_columns)}"}, 400

except Exception as e:
    return {"detail": f"Erreur lors de la lecture du fichier: {str(e)}"}, 400
```

### 3. Data Processing:

```python
# Process each student record
for index, row in df.iterrows():
    student_data = {
        "matricule": row["Matricule"],
        "promo": promo.strip(),  # Use the promo from form data
        "sys1": row["SYS1"],
        "res1": row["RES1"],
        "anum": row["ANUM"],
        "ro": row["RO"],
        "org": row["ORG"],
        "lang1": row["LANG1"],
        "igl": row["IGL"],
        "thp": row["THP"],
        "rang_s1": row["Rang S1"],
        "moy_s1": row["Moy S1"],
        "mcsi": row["MCSI"],
        "bdd": row["BDD"],
        "sec": row["SEC"],
        "cproj": row["CPROJ"],
        "proj": row["PROJ"],
        "lang2": row["LANG2"],
        "arch": row["ARCH"],
        "sys2": row["SYS2"],
        "res2": row["RES2"],
        "rang_s2": row["Rang S2"],
        "moy_s2": row["Moy S2"],
        "rang": row["Rang"],
        "moy_rachat": row["Moy Rachat"],
        # Note: No more "Affectation" field from file
    }

    # Save to database or process as needed
    save_student_data(student_data)
```

### 4. Success Response:

```python
return {
    "success": True,
    "message": f"Données de {len(df)} étudiants importées avec succès pour la promotion {promo}"
}
```

## Example Implementation (FastAPI):

```python
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
import pandas as pd
import io

@app.post("/api/upload/student-data")
async def upload_student_data(
    file: UploadFile = File(...),
    promo: str = Form(...)
):
    # Validate file type
    if file.content_type not in [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]:
        raise HTTPException(
            status_code=400,
            detail="Format de fichier non supporté. Veuillez utiliser CSV, XLS ou XLSX"
        )

    # Validate promo
    if not promo.strip():
        raise HTTPException(
            status_code=400,
            detail="La promotion est obligatoire"
        )

    try:
        # Read file content
        contents = await file.read()

        # Parse based on file type
        if file.content_type == 'text/csv':
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        else:
            df = pd.read_excel(io.BytesIO(contents))

        # Validate columns
        required_columns = [
            "Matricule", "SYS1", "RES1", "ANUM", "RO", "ORG", "LANG1", "IGL", "THP",
            "Rang S1", "Moy S1", "MCSI", "BDD", "SEC", "CPROJ", "PROJ", "LANG2",
            "ARCH", "SYS2", "RES2", "Rang S2", "Moy S2", "Rang", "Moy Rachat"
        ]

        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Colonnes manquantes: {', '.join(missing_columns)}"
            )

        # Process and save data
        processed_students = []
        for _, row in df.iterrows():
            # Create student record with promo from form data
            student_data = {
                "matricule": row["Matricule"],
                "promo": promo.strip(),
                "sys1": row["SYS1"],
                "res1": row["RES1"],
                "anum": row["ANUM"],
                "ro": row["RO"],
                "org": row["ORG"],
                "lang1": row["LANG1"],
                "igl": row["IGL"],
                "thp": row["THP"],
                "rang_s1": row["Rang S1"],
                "moy_s1": row["Moy S1"],
                "mcsi": row["MCSI"],
                "bdd": row["BDD"],
                "sec": row["SEC"],
                "cproj": row["CPROJ"],
                "proj": row["PROJ"],
                "lang2": row["LANG2"],
                "arch": row["ARCH"],
                "sys2": row["SYS2"],
                "res2": row["RES2"],
                "rang_s2": row["Rang S2"],
                "moy_s2": row["Moy S2"],
                "rang": row["Rang"],
                "moy_rachat": row["Moy Rachat"],
            }

            # Save to database
            # await save_student(student_data)
            processed_students.append(student_data)

        return {
            "success": True,
            "message": f"Données de {len(df)} étudiants importées avec succès pour la promotion {promo}"
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Erreur lors du traitement du fichier: {str(e)}"
        )
```

## Example Implementation (Django):

```python
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import pandas as pd

@csrf_exempt
@require_http_methods(["POST"])
def upload_student_data(request):
    # Get file and promo from request
    file = request.FILES.get('file')
    promo = request.POST.get('promo')

    # Validate inputs
    if not file:
        return JsonResponse({"detail": "Fichier manquant"}, status=400)

    if not promo or not promo.strip():
        return JsonResponse({"detail": "La promotion est obligatoire"}, status=400)

    # Validate file type
    allowed_types = ['text/csv', 'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if file.content_type not in allowed_types:
        return JsonResponse({
            "detail": "Format de fichier non supporté. Veuillez utiliser CSV, XLS ou XLSX"
        }, status=400)

    try:
        # Read and parse file
        if file.content_type == 'text/csv':
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)

        # Validate required columns
        required_columns = [
            "Matricule", "SYS1", "RES1", "ANUM", "RO", "ORG", "LANG1", "IGL", "THP",
            "Rang S1", "Moy S1", "MCSI", "BDD", "SEC", "CPROJ", "PROJ", "LANG2",
            "ARCH", "SYS2", "RES2", "Rang S2", "Moy S2", "Rang", "Moy Rachat"
        ]

        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            return JsonResponse({
                "detail": f"Colonnes manquantes: {', '.join(missing_columns)}"
            }, status=400)

        # Process data
        for _, row in df.iterrows():
            # Create and save student record
            student_data = {
                "matricule": row["Matricule"],
                "promo": promo.strip(),
                # ... map all other fields
            }
            # Save to database using your model
            # Student.objects.create(**student_data)

        return JsonResponse({
            "success": True,
            "message": f"Données de {len(df)} étudiants importées avec succès pour la promotion {promo}"
        })

    except Exception as e:
        return JsonResponse({
            "detail": f"Erreur lors du traitement du fichier: {str(e)}"
        }, status=400)
```

## Key Changes from Previous Implementation:

1. **No more "Promo" column in CSV file** - it's now provided separately
2. **No more "Affectation" column in CSV file** - removed from requirements
3. **Promo is mandatory** - must be provided in form data
4. **All students in one file belong to the same promo** - the promo from form
   data applies to all records

## Required Dependencies:

- `pandas` for file processing
- `openpyxl` for Excel file support (if using pandas)
- `xlrd` for older Excel files (if needed)

## Database Schema Considerations:

Make sure your student model/table includes:

- All the subject fields (SYS1, RES1, etc.)
- A `promo` field to store the promotion
- Remove or make optional any `affectation` field if it exists
