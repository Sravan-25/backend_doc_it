class ApiResponse {
  constructor(res) {
    this.res = res;
  }

  success(data, message = 'Success', statusCode = 200) {
    return this.res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  error(message = 'Something went wrong', statusCode = 400, error = null) {
    const response = {
      success: false,
      message,
    };
    if (error) response.error = error;
    return this.res.status(statusCode).json(response);
  }

  pagination(data, total, page, limit, message = 'Success') {
    return this.res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  }
}

module.exports = ApiResponse;
