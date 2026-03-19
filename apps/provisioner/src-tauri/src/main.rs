// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// HTTP request payload from frontend
#[derive(Debug, Deserialize)]
pub struct HttpRequest {
    pub url: String,
    pub method: String,
    pub headers: HashMap<String, String>,
    pub body: Option<String>,
}

/// HTTP response to frontend
#[derive(Debug, Serialize)]
pub struct HttpResponse {
    pub status: u16,
    pub body: String,
    pub error: Option<String>,
}

/// Make an HTTP request to external APIs (bypasses CORS)
#[tauri::command]
async fn http_request(request: HttpRequest) -> Result<HttpResponse, String> {
    let client = reqwest::Client::new();
    
    // Build the request
    let mut req_builder = match request.method.to_uppercase().as_str() {
        "GET" => client.get(&request.url),
        "POST" => client.post(&request.url),
        "PUT" => client.put(&request.url),
        "DELETE" => client.delete(&request.url),
        "PATCH" => client.patch(&request.url),
        _ => return Err(format!("Unsupported HTTP method: {}", request.method)),
    };
    
    // Add headers
    for (key, value) in request.headers {
        req_builder = req_builder.header(&key, &value);
    }
    
    // Add body if present
    if let Some(body) = request.body {
        req_builder = req_builder.body(body);
    }
    
    // Execute request
    match req_builder.send().await {
        Ok(response) => {
            let status = response.status().as_u16();
            match response.text().await {
                Ok(body) => Ok(HttpResponse {
                    status,
                    body,
                    error: None,
                }),
                Err(e) => Ok(HttpResponse {
                    status,
                    body: String::new(),
                    error: Some(format!("Failed to read response body: {}", e)),
                }),
            }
        }
        Err(e) => {
            // Categorize the error for better diagnostics
            let error_msg = if e.is_connect() {
                format!("Connection failed: Unable to reach {}. Check your internet connection.", request.url)
            } else if e.is_timeout() {
                "Request timed out. The server took too long to respond.".to_string()
            } else if e.is_request() {
                format!("Invalid request: {}", e)
            } else {
                format!("HTTP request failed: {}", e)
            };
            
            Ok(HttpResponse {
                status: 0,
                body: String::new(),
                error: Some(error_msg),
            })
        }
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![http_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
