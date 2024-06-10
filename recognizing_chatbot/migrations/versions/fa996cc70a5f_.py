"""empty message

Revision ID: fa996cc70a5f
Revises: 5d29b877ea34
Create Date: 2024-02-08 15:31:11.054397

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fa996cc70a5f'
down_revision = '5d29b877ea34'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.add_column(sa.Column('screenshot_path', sa.String(length=255), nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_column('screenshot_path')

    # ### end Alembic commands ###
