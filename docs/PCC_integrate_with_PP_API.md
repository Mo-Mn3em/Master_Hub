# PCC Integrate with PP (Patient Portal) — API Documentation

## 📌 Overview
The **`PCC_integrate_with_PP`** API is a dedicated integration bridge between the **Patient Coordinator Center (PCC)** and the external **Patient Portal (PP)**. 

It provides secure, authenticated access to a patient's complete demographic profile, admission clinical notes, and **entire hospital visit timeline** (including all past outpatient/inpatient visits and scheduled upcoming appointments) retrieved live from the Nile Alamal Hospital Information System (HIS).

---

## 🌐 Endpoint Details

| Attribute | Value |
| :--- | :--- |
| **API Name** | `PCC_integrate_with_PP` |
| **URL (Local Machine)** | `http://localhost:8000/api/PCC_integrate_with_PP` |
| **URL (Local Network / LAN)** | `http://10.2.2.155/api/PCC_integrate_with_PP` *(Port 80)* |
| **URL (Local Network Port 8000)** | `http://10.2.2.155:8000/api/PCC_integrate_with_PP` |
| **URL Alias (Lowercase)** | `http://10.2.2.155/api/pcc_integrate_with_pp` |
| **HTTP Method** | `POST` *(also supports `GET` with query parameters)* |
| **Content-Type** | `application/json` |
| **Accept** | `application/json` |
| **Authentication Type** | 3-Credential Patient Verification (`mrn` + `national_id` + `date_of_birth`) |

---

## 🔐 Authentication & Security Model
Access to patient data requires matching **all three** of the following parameters against the official hospital record in the `cases` table:
1. **`mrn`**: Medical Record Number assigned to the patient.
2. **`national_id`**: 14-digit Egyptian National Identification Number.
3. **`date_of_birth`**: Patient's Date of Birth (supports `YYYY-MM-DD` or `DD/MM/YYYY`).

If any of the 3 credentials do not match, the API rejects the request immediately with an HTTP `401 Unauthorized` status.

---

## 📥 Request Specification

### Request Headers
```http
Content-Type: application/json
Accept: application/json
```

### Request Body Parameters

| Field | Type | Required | Description | Example |
| :--- | :---: | :---: | :--- | :--- |
| `mrn` | `string` | **Yes** | Medical Record Number of the patient | `"20250883"` |
| `national_id` | `string` | **Yes** | 14-digit National ID | `"32210012901727"` |
| `date_of_birth` | `string` | **Yes** | Date of birth (`YYYY-MM-DD` or `DD/MM/YYYY`) | `"2022-10-01"` |

### Example Request Body (JSON)
```json
{
  "mrn": "20250883",
  "national_id": "32210012901727",
  "date_of_birth": "2022-10-01"
}
```

---

## 📤 Response Specification

### Successful Response (`200 OK`)

The response returns a single JSON object containing all the patient's personal and medical profile details, together with the complete `patient_visits` array.

#### Response Body Fields Dictionary

| Field | Type | Description |
| :--- | :---: | :--- |
| `id` | `integer` | Unique Case ID in PCC system |
| `mrn` | `string` | Medical Record Number |
| `full_name` | `string` | Full name of the patient (Arabic) |
| `gender` | `string` | `"male"` or `"female"` |
| `national_id` | `string` | 14-digit National ID |
| `date_of_birth` | `string` | Date of birth in `YYYY-MM-DD` format |
| `age` | `integer` | Current age in years |
| `phone_number` | `string` | Primary contact phone number |
| `government` | `string` | Governorate / Province (e.g., `"Luxor"`, `"Cairo"`) |
| `outside_egypt_details` | `string\|null` | Details if the patient resides outside Egypt |
| `blood_group` | `string\|null` | Blood group (e.g., `"A+"`, `"B+"`, `"O+"`, `"AB-"`) |
| `motor_problem` | `string\|null` | Motor problem status (`"yes"` or `"no"`) |
| `motor_problem_detail` | `string\|null` | Specific notes regarding motor issues |
| `date_of_joining_request` | `string\|null` | Date when the case joined the PCC program |
| `cause_of_acceptance` | `string\|null` | Clinical reason / program acceptance cause |
| `general_medical_history` | `string\|null` | Clinical background, past diagnoses, or allergies |
| `patient_visits` | `array` | **Complete list** of all hospital visits and appointments |

#### Structure of each item in `patient_visits`

| Sub-Field | Type | Description | Example |
| :--- | :---: | :--- | :--- |
| `visitNumber` | `integer` | Sequential visit number | `3` |
| `visitTypeAr` | `string` | Visit classification in Arabic | `"خارجى"` |
| `visitTypeEn` | `string` | Visit classification in English | `"Outpatient"` |
| `visitStartdate` | `string` | Visit admission date & time | `"26/08/2026 09:59:01"` |
| `visitEnddate` | `string` | Visit checkout / completion date & time | `"27/08/2026 00:50:01"` |
| `placeNameAr` | `string` | Clinic / Ward name in Arabic | `"عيادة امراض القلب"` |
| `placeNameEn` | `string` | Clinic / Ward name in English | `"Cardiology clinic"` |
| `doctorNameAr` | `string` | Attending physician in Arabic | `"مروه على حسين الدرديرى"` |
| `doctorNameEn` | `string` | Attending physician in English | `"Marwa Ali Hossen Eldardery"` |
| `doctorSpecialtyAr` | `string` | Physician specialty in Arabic | `"أمراض القلب"` |
| `doctorSpecialtyEn` | `string` | Physician specialty in English | `"Cardiology"` |

---

### Example Response (`200 OK`)

```json
{
  "id": 3,
  "mrn": "20250883",
  "full_name": "صفا طه حجاجى عبدالسلام",
  "gender": "female",
  "national_id": "32210012901727",
  "date_of_birth": "2022-10-01",
  "age": 4,
  "phone_number": "01127611677",
  "government": "Luxor",
  "outside_egypt_details": null,
  "blood_group": "B+",
  "motor_problem": "no",
  "motor_problem_detail": null,
  "date_of_joining_request": "2026-09-06",
  "cause_of_acceptance": null,
  "general_medical_history": null,
  "patient_visits": [
    {
      "visitNumber": 3,
      "visitTypeAr": "خارجى",
      "visitTypeEn": "Outpatient",
      "visitStartdate": "26/08/2026 09:59:01",
      "visitEnddate": "27/08/2026 00:50:01",
      "placeNameAr": "عيادة امراض القلب",
      "placeNameEn": "Cardiology clinic",
      "doctorNameAr": "مروه على حسين الدرديرى ",
      "doctorNameEn": "Marwa Ali Hossen Eldardery ",
      "doctorSpecialtyAr": " أمراض القلب",
      "doctorSpecialtyEn": "Cardiology"
    },
    {
      "visitNumber": 2,
      "visitTypeAr": "خارجى",
      "visitTypeEn": "Outpatient",
      "visitStartdate": "26/08/2026 09:53:01",
      "visitEnddate": "27/08/2026 00:50:01",
      "placeNameAr": "عيادة التخدير",
      "placeNameEn": "Anesthesia Clinic",
      "doctorNameAr": "بلال محمد بكر حسن ",
      "doctorNameEn": "Belal Mohamed Bakr Hassan ",
      "doctorSpecialtyAr": "التخدير",
      "doctorSpecialtyEn": "Anesthesiology"
    },
    {
      "visitNumber": 1,
      "visitTypeAr": "خارجى",
      "visitTypeEn": "Outpatient",
      "visitStartdate": "11/02/2025 15:12:17",
      "visitEnddate": "11/02/2025 23:50:01",
      "placeNameAr": "أنف واذن وحنجرة",
      "placeNameEn": "E.N.T",
      "doctorNameAr": "عمر حسنى قطب طه ",
      "doctorNameEn": "Omar Huosny Kotb Taha ",
      "doctorSpecialtyAr": " الأذن والحنجرة",
      "doctorSpecialtyEn": "Otolaryngology"
    }
  ]
}
```

---

## 🚫 Error Responses

### 1. Authentication Failed (`401 Unauthorized`)
Returned when no record matches the combination of `mrn`, `national_id`, and `date_of_birth`:

```json
{
  "status": "error",
  "message": "Authentication failed. No matching patient record found for the provided credentials."
}
```

### 2. Missing Parameters (`422 Unprocessable Entity`)
Returned when any of the 3 required fields (`mrn`, `national_id`, `date_of_birth`) are omitted or empty:

```json
{
  "status": "error",
  "message": "Authentication failed. mrn, national_id, and date_of_birth are required."
}
```

---

## 💾 Database Persistence & Side-Effects
When this API is called:
1. **Live HIS Query**: The system queries the hospital HIS endpoint (`/nile/patient-visits`) for real-time visits data.
2. **JSON Column Update**: It updates the `cases.patient_visits` column with the fresh visits JSON array.
3. **Relational Table Synchronization**: It inserts or updates individual visit rows in the dedicated `patient_visits` MySQL table (`case_id`, `mrn`, `visit_number`, `place_name`, `doctor_name`, etc.), preventing duplicates using `visit_number` and `visit_start_date`.

---

## 💻 Code Integration Examples

### cURL
```bash
curl -X POST "http://localhost:8000/api/PCC_integrate_with_PP" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "mrn": "20250883",
    "national_id": "32210012901727",
    "date_of_birth": "2022-10-01"
  }'
```

### JavaScript / TypeScript (fetch)
```typescript
async function fetchPatientPortalData(mrn: string, nationalId: string, dob: string) {
  const response = await fetch("http://localhost:8000/api/PCC_integrate_with_PP", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      mrn: mrn,
      national_id: nationalId,
      date_of_birth: dob, // "YYYY-MM-DD"
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to authenticate patient");
  }

  const patientData = await response.json();
  console.log("Patient Demographics:", patientData.full_name, patientData.age);
  console.log("All Visits:", patientData.patient_visits);
  return patientData;
}
```

### Python
```python
import requests

url = "http://localhost:8000/api/PCC_integrate_with_PP"
payload = {
    "mrn": "20250883",
    "national_id": "32210012901727",
    "date_of_birth": "2022-10-01"
}
headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}

response = requests.post(url, json=payload, headers=headers)

if response.status_code == 200:
    data = response.json()
    print("Patient:", data["full_name"])
    print("Total Visits:", len(data["patient_visits"]))
else:
    print("Error:", response.status_code, response.json())
```

### PHP
```php
<?php
$client = new \GuzzleHttp\Client();

$response = $client->post('http://localhost:8000/api/PCC_integrate_with_PP', [
    'json' => [
        'mrn'           => '20250883',
        'national_id'   => '32210012901727',
        'date_of_birth' => '2022-10-01',
    ],
    'headers' => [
        'Accept' => 'application/json',
    ],
]);

$data = json_decode($response->getBody(), true);
print_r($data);
```
