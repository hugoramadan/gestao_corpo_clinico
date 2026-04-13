def validate_cpf_digits(cpf: str) -> bool:
    """
    Valida CPF pelo algoritmo oficial dos dois dígitos verificadores.
    Recebe CPF já normalizado (apenas dígitos, 11 caracteres).
    """
    if len(cpf) != 11 or not cpf.isdigit():
        return False
    # Rejeita sequências trivialmente inválidas (ex: 00000000000, 11111111111)
    if len(set(cpf)) == 1:
        return False

    def _digit(digits: str, length: int) -> int:
        total = sum(int(d) * (length + 1 - i) for i, d in enumerate(digits[:length]))
        remainder = total % 11
        return 0 if remainder < 2 else 11 - remainder

    if _digit(cpf, 9) != int(cpf[9]):
        return False
    if _digit(cpf, 10) != int(cpf[10]):
        return False
    return True
