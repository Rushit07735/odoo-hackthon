"""
DayFlow Backend - Application Entry Point
"""
from app import create_app

try:
    app = create_app()
    print("App created successfully")
    app.run(host='127.0.0.1', port=5000, debug=True)
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
