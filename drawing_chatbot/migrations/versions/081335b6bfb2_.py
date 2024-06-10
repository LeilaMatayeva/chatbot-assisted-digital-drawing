"""empty message

Revision ID: 081335b6bfb2
Revises: 8bfad68d93e8
Create Date: 2024-02-19 14:44:03.637975

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '081335b6bfb2'
down_revision = '8bfad68d93e8'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('chat_message', schema=None) as batch_op:
        batch_op.add_column(sa.Column('timestamp', sa.DateTime(), nullable=True))

    with op.batch_alter_table('chatbot_message', schema=None) as batch_op:
        batch_op.add_column(sa.Column('timestamp', sa.DateTime(), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('chatbot_message', schema=None) as batch_op:
        batch_op.drop_column('timestamp')

    with op.batch_alter_table('chat_message', schema=None) as batch_op:
        batch_op.drop_column('timestamp')

    # ### end Alembic commands ###
