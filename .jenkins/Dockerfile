FROM jenkins/jenkins:lts

USER root

# Install Node.js dependencies and other required packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    rsync \
    sudo \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Add jenkins user to sudoers
RUN echo "jenkins ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER jenkins