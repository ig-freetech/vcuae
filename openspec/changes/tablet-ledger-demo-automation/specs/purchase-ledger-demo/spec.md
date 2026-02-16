## ADDED Requirements

### Requirement: Two-Step Ledger Input Flow
The system SHALL provide a two-step tablet form flow where customer information is captured first and staff confirmation fields are captured second before a record can be submitted.

#### Scenario: Customer information is completed first
- **WHEN** a new form session starts
- **THEN** the customer input step SHALL be shown before staff confirmation fields

#### Scenario: Staff step requires customer step completion
- **WHEN** required fields in the customer step are incomplete
- **THEN** the system SHALL block progression to the staff step and show field-level validation errors

### Requirement: Required and Optional Field Validation
The system SHALL validate required fields and data formats before accepting submission to the backend.

#### Scenario: Required field is missing
- **WHEN** any required field is empty at step transition or final submission
- **THEN** the system SHALL reject the action and identify the invalid fields

#### Scenario: Email and numeric fields are invalid
- **WHEN** `Email`, `総買取額`, or `総合計` contains invalid format
- **THEN** the system SHALL prevent submission and return a validation error

### Requirement: Derived Fields Auto Calculation
The system SHALL automatically derive `Age`, `誕生月`, `CountryJP`, `Continent大陸`, and `Subregion小地域` from submitted values.

#### Scenario: Age and birth month are derived from birthday and visit date
- **WHEN** valid `Birthday` and `VisitDate` are provided
- **THEN** the system SHALL calculate `Age` and `誕生月` without manual input

#### Scenario: Country metadata is derived from country value
- **WHEN** a country value matches the internal country mapping table
- **THEN** the system SHALL populate `CountryJP`, `Continent大陸`, and `Subregion小地域` automatically

#### Scenario: Unknown country fallback is applied
- **WHEN** a country value does not match the internal mapping table
- **THEN** the system SHALL keep the original country text and set derived geography fields to fallback values

### Requirement: Spreadsheet Row Mapping Compatibility
The system SHALL append data in the exact target spreadsheet column order to preserve existing reporting compatibility.

#### Scenario: Record is transformed to fixed schema
- **WHEN** a submission passes validation
- **THEN** the system SHALL build one row matching the fixed column order `VisitDate` through `総合計`

#### Scenario: Optional values are preserved safely
- **WHEN** optional fields such as `Email` or `REF` are omitted
- **THEN** the system SHALL append empty values without shifting any column position

### Requirement: Apps Script Submission Contract
The system SHALL submit form payloads to a Google Apps Script Web App endpoint and handle success and failure responses.

#### Scenario: Valid payload is accepted by Apps Script
- **WHEN** a payload with valid schema and API key is posted
- **THEN** the endpoint SHALL append one row and return `ok=true` with row metadata

#### Scenario: Invalid payload is rejected by Apps Script
- **WHEN** payload validation fails or authentication fails
- **THEN** the endpoint SHALL return `ok=false` with a machine-readable error code

### Requirement: Duplicate Submission Prevention
The system SHALL prevent accidental duplicate submissions from repeated user interaction.

#### Scenario: Submit button is pressed repeatedly
- **WHEN** a submission request is already in-flight
- **THEN** the system SHALL ignore additional submit actions until the request resolves
