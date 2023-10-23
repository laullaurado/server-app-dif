import random
from datetime import datetime, timedelta

# List of valid usuario values
usuarios = [
    'PEPE2', 'PEPE10', 'PEPE13', 'PEPE15', 'PEPE16', 'PEPE20',
    'PEPE30', 'PEPE31', 'Lau31', 'AZAMAR123', 'GONZ123', 'CURP',
    'Curp', 'GONZ1', 'HOLAADIOS', 'GONZ12', 'CURP3', 'USAB1234HGFEDC78',
    'USWX9876LKJHGF12', 'USMN2468KIHG3579', 'USQW7531LKJH4682',
    'USAS8642PLMOK573', 'USMN8642PLMOK573', 'USZX1357KJHG6824',
    'USLK2468ASDF7935', 'USPO7531ZXCV8046', 'USMJ78642QWPO9157',
    'USNH8642ASDF0268'
]

# Function to generate a random date within the specified range
def random_date(start_date, end_date):
    delta = end_date - start_date
    random_days = random.randint(0, delta.days)
    random_seconds = random.randint(0, 86400)  # Seconds in a day
    return start_date + timedelta(days=random_days, seconds=random_seconds)

# Generate SQL statements
num_entries = 11
start_date = datetime(2023, 1, 1)
end_date = datetime(2023, 10, 16)

donaciones = True

insert_statements = []

for _ in range(num_entries):
    usuario = random.choice(usuarios)
    comedor = 1
    fecha_hora = random_date(start_date, end_date).strftime('%Y-%m-%d %H:%M:%S')
    racion_pagada = not(donaciones)
    
    if racion_pagada:
        donado_por = 'null'
        insert_statement = f"INSERT INTO Visita (usuario, comedor, fechaHora, racionPagada, donadoPor, paraLlevar) VALUES ('{usuario}', {comedor}, '{fecha_hora}', {str(racion_pagada).lower()}, {donado_por}, false);"
    else:
        donado_por = random.choice([
            'ABCD123456HGFEDC78', 'WXYZ987654LKJHGF12', 'MNBV2468KIHG3579',
            'QWPO7531LKJH4682', 'ASDF8642PLMOK573', 'ZXCV1357KJHG6824',
            'LKJH2468ASDF7935', 'POIU7531ZXCV8046', 'MJU78642QWPO9157',
            'NHYT8642ASDF0268'
        ])
        
        insert_statement = f"INSERT INTO Visita (usuario, comedor, fechaHora, racionPagada, donadoPor, paraLlevar) VALUES ('{usuario}', {comedor}, '{fecha_hora}', {str(racion_pagada).lower()}, '{donado_por}', false);"
    
    
    insert_statements.append(insert_statement)

# Output the generated SQL statements
for statement in insert_statements:
    print(statement)
