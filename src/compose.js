import YAML from 'yaml';

export const buildComposeFile = ({
  configUrl,
  sshPrivateKey,
  sshPublicKey,
  knownHosts
}) => {
  const document = {
    version: '3.9',
    services: {
      proxy: {
        image: 'ghcr.io/tbxark/mcp-proxy:latest',
        restart: 'unless-stopped',
        command: ['--config', configUrl],
        environment: {
          HOME: '/home/mcp',
          NODE_ENV: 'production',
          SSH_PRIVATE_KEY: sshPrivateKey,
          SSH_PUBLIC_KEY: sshPublicKey,
          SSH_KNOWN_HOSTS: knownHosts
        },
        expose: ['8080'],
        volumes: ['proxy-home:/home/mcp']
      }
    },
    volumes: {
      'proxy-home': {}
    }
  };

  const yaml = new YAML.Document(document);
  yaml.commentBefore = 'Generated automatically by the MCP user factory';
  yaml.contents.items?.[1]?.value?.items?.forEach((service) => {
    if (service?.key?.value === 'proxy') {
      service.value.commentBefore = 'Primary MCP proxy service';
    }
  });

  return yaml.toString();
};
