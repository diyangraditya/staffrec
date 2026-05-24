# Use the official AWS Lambda Python 3.11 base image
FROM public.ecr.aws/lambda/python:3.11

# Install uv for fast dependency resolution
RUN pip install uv

# Copy dependencies config
COPY pyproject.toml .

# Install dependencies into system site-packages (Lambda requires this)
RUN uv pip install --system --no-cache $(python -c "import tomllib; d=tomllib.load(open('pyproject.toml','rb')); print(' '.join(d['project']['dependencies']))")

# Copy the rest of the application code
COPY . ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler
CMD ["app.main.lambda_handler"]
