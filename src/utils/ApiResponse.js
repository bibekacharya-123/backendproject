class ApiResponse {
  constructor(status, message = "success", data) {
    this.status = status;
    this.message = message;
    this.data = data;
    this.success = status >= 200 && status < 300;
  }
}

export { ApiResponse };