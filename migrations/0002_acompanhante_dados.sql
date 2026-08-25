-- Nome e telefone do acompanhante (capturados quando o convidado seleciona
-- "+1 acompanhante" no formulário). A coluna "empresa" fica sem uso a partir
-- daqui (o campo foi removido do formulário), mas não é apagada — só passa
-- a ficar sempre NULL nas novas confirmações.
ALTER TABLE rsvps ADD COLUMN acompanhante_nome TEXT;
ALTER TABLE rsvps ADD COLUMN acompanhante_telefone TEXT;
