# Use the official AWS Lambda Python 3.11 base image
FROM public.ecr.aws/lambda/python:3.11

# Install uv for fast dependency resolution
RUN pip install uv

# Copy dependencies config
COPY pyproject.toml .

# Extract dependencies and install directly into LAMBDA_TASK_ROOT
RUN python -c "import tomllib; d=tomllib.load(open('pyproject.toml','rb')); print('\n'.join(d['project']['dependencies']))" > reqs.txt
RUN uv pip install --system --target ${LAMBDA_TASK_ROOT} -r reqs.txt

# Copy the rest of the application code
COPY . ${LAMBDA_TASK_ROOT}

# Set the CMD to your handler
CMD ["app.main.lambda_handler"]
